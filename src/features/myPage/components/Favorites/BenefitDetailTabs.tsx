import { useEffect, useMemo, useState } from 'react';
import SafeImage from '../../../../components/SafeImage';
import Link from 'next/link';
import { fetchFavoriteDetail } from '../../apis/favorites';
import type { FavoriteDetail } from '../../../../types/favorites';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import NoResult from '../../../../components/NoResult';
import {
  getCarrierGradeOrder,
  getCarrierLabel,
  getMembershipGradeLabel,
  isCarrierCode,
  isGradeApplicableToProfile,
} from '../../../../utils/membership';
import {
  groupFavoriteTiersByCarrier,
  isFavoriteTierApplicableToProfile,
} from '../../utils/favoriteMembership.mjs';
import { getPartnerBenefitPath } from '../../../../utils/partnerSeo';

interface Props {
  benefitId: number;
  image: string;
  name: string;
  userCarrier?: string | null;
  userGrade?: string | null;
}

const carrierLabel = (carrier: string | null) =>
  isCarrierCode(carrier) ? getCarrierLabel(carrier) : '정보 없음';

export default function BenefitDetailTabs({
  benefitId,
  image,
  name,
  userCarrier,
  userGrade,
}: Props) {
  const [detail, setDetail] = useState<FavoriteDetail | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);
    setDetail(null);

    fetchFavoriteDetail(benefitId)
      .then(
        (response) => {
          if (!isMounted) return;
          const nextDetail = response.data;
          const groups = groupFavoriteTiersByCarrier(nextDetail.tiers);
          const initialGroup =
            groups.find((group) => group.carrier === userCarrier) ??
            groups.find((group) => isCarrierCode(group.carrier)) ??
            groups[0];

          setDetail(nextDetail);
          setSelectedCarrier(initialGroup?.carrier ?? null);
          setSelectedGrade(null);
        },
        () => {
          if (!isMounted) return;
          setError(true);
        }
      )
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [benefitId, retryCount, userCarrier, userGrade]);

  const carrierGroups = useMemo(() => groupFavoriteTiersByCarrier(detail?.tiers ?? []), [detail]);
  const selectedGroup =
    carrierGroups.find((group) => group.carrier === selectedCarrier) ?? carrierGroups[0] ?? null;
  const allGradeCondition = selectedGroup?.tiers.find((tier) => tier.isAll);
  const gradeConditions = selectedGroup?.tiers.filter((tier) => !tier.isAll) ?? [];
  const availableGrades = Array.from(new Set(gradeConditions.map((tier) => tier.grade)));
  const gradeTabs = selectedGroup
    ? getCarrierGradeOrder(selectedGroup.carrier, availableGrades).filter((grade) =>
        availableGrades.includes(grade)
      )
    : [];
  const activeGrade =
    (selectedGrade && gradeTabs.includes(selectedGrade) ? selectedGrade : null) ??
    (selectedGroup?.carrier === userCarrier && userGrade && gradeTabs.includes(userGrade)
      ? userGrade
      : null) ??
    gradeTabs[0] ??
    null;
  const selectedCondition = gradeConditions.find((tier) => tier.grade === activeGrade) ?? null;
  const hasMembershipProfile = Boolean(userCarrier && userGrade);
  const selectedConditionApplies = Boolean(
    selectedGroup &&
      selectedCondition &&
      isFavoriteTierApplicableToProfile(
        selectedCondition,
        userCarrier,
        userGrade,
        isGradeApplicableToProfile
      )
  );

  if (loading) {
    return (
      <div
        role="status"
        aria-label="혜택 상세 정보를 불러오는 중"
        className="flex min-h-32 items-center justify-center"
      >
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex min-h-32 flex-col items-center justify-center gap-3 py-6 text-center"
      >
        <p className="text-sm leading-6 text-grey05">혜택 상세 정보를 불러오지 못했어요.</p>
        <button
          type="button"
          onClick={() => setRetryCount((count) => count + 1)}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-brand px-4 text-sm font-semibold text-brandStrong hover:bg-brandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex min-h-32 items-center justify-center">
        <NoResult
          message1="혜택 상세 정보가 없어요"
          message2="선택한 혜택의 상세 내용을 확인할 수 없어요."
          message1FontSize="text-title-6 max-xl:text-title-7"
          message2FontSize="text-body-3 max-xl:text-body-4"
          isLoginRequired={false}
        />
      </div>
    );
  }

  const displayImage = detail.partnerImage || image;
  const displayName = detail.partnerName || name || '제휴처';
  const isKnownCarrier = selectedGroup ? isCarrierCode(selectedGroup.carrier) : false;
  const carrierPolicy =
    isKnownCarrier && selectedGroup
      ? detail.carrierPolicies?.find((policy) => policy.carrier === selectedGroup.carrier)
      : undefined;
  const mayUseLegacyMetadata = carrierGroups.length === 1 && isKnownCarrier;
  const selectedDescription = detail.carrierPolicies
    ? carrierPolicy?.description
    : mayUseLegacyMetadata
      ? detail.benefitDescription
      : null;
  const selectedLimit = detail.carrierPolicies
    ? carrierPolicy?.benefitLimit
    : mayUseLegacyMetadata
      ? detail.benefitLimit
      : null;
  const normalizedLimit = selectedLimit?.trim();
  const limitText =
    normalizedLimit && normalizedLimit !== '제한없음'
      ? normalizedLimit
      : '이용 방법에서 횟수·한도를 확인해 주세요.';
  const allGradeContext = allGradeCondition?.context?.trim();
  const selectedConditionContext = selectedCondition?.context?.trim();
  const fullDetailHref =
    typeof detail.partnerId === 'number' && detail.partnerId > 0
      ? `${getPartnerBenefitPath(detail.partnerId, displayName)}${
          selectedGroup?.carrier ? `?carrier=${encodeURIComponent(selectedGroup.carrier)}` : ''
        }#benefit-${benefitId}`
      : `/benefits?q=${encodeURIComponent(displayName)}`;
  const eligibilityMessage = !selectedGroup
    ? ''
    : !isKnownCarrier
      ? '통신사 정보를 확인할 수 없어 개인 멤버십 적용 여부를 판단할 수 없어요.'
      : !hasMembershipProfile
        ? '회원 정보에서 통신사와 등급을 선택하면 내 조건을 확인할 수 있어요.'
        : selectedGroup.carrier !== userCarrier
          ? `현재 선택한 멤버십(${getCarrierLabel(userCarrier)})과 다른 통신사의 조건입니다.`
          : allGradeCondition || selectedConditionApplies
            ? '선택한 멤버십 프로필에 적용되는 조건입니다.'
            : '선택한 멤버십 프로필과 다른 등급의 조건입니다.';

  return (
    <section aria-label={`${displayName} 혜택 상세`} className="w-full min-w-0">
      <div className="flex min-w-0 items-center gap-3 border-b border-warmBorder pb-4">
        <SafeImage
          src={displayImage}
          alt={`${displayName} 로고`}
          fallbackLabel={displayName}
          className="h-11 w-11 shrink-0 rounded-lg border border-warmBorder bg-white object-contain p-1"
        />
        <p className="min-w-0 break-words text-base font-semibold text-ink">{displayName}</p>
      </div>

      {carrierGroups.length > 1 ? (
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="통신사별 혜택 조건">
          {carrierGroups.map((group, index) => (
            <button
              key={`${group.carrier ?? 'unknown'}-${index}`}
              type="button"
              aria-pressed={selectedGroup?.carrier === group.carrier}
              aria-label={
                isCarrierCode(group.carrier)
                  ? `${getCarrierLabel(group.carrier)} 혜택 조건`
                  : `통신사 정보 없음 ${index + 1} 혜택 조건`
              }
              onClick={() => {
                setSelectedCarrier(group.carrier);
                setSelectedGrade(null);
              }}
              className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-3 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                selectedGroup?.carrier === group.carrier
                  ? 'border-brand bg-brandSoft text-brandStrong'
                  : 'border-warmBorder bg-white text-grey05 hover:bg-warmCanvas'
              }`}
            >
              {carrierLabel(group.carrier)}
            </button>
          ))}
        </div>
      ) : selectedGroup ? (
        <p className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-warmCanvas px-3 text-base font-semibold text-ink">
          {carrierLabel(selectedGroup.carrier)} 혜택 조건
        </p>
      ) : null}

      {selectedDescription?.trim() ? (
        <p className="mt-4 whitespace-pre-line break-words text-sm leading-6 text-grey06">
          {selectedDescription}
        </p>
      ) : null}
      {selectedGroup ? (
        <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-grey05">
          <span className="font-semibold text-ink">횟수·한도</span> · {limitText}
        </p>
      ) : null}

      {selectedGroup ? (
        <div className="mt-4 rounded-xl border border-warmBorder bg-white p-4">
          {allGradeCondition ? (
            <div>
              <p className="inline-flex min-h-8 items-center rounded-md bg-brandSoft px-2.5 text-sm font-semibold text-brandStrong">
                모든 등급
              </p>
              <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-grey06">
                {allGradeCondition.context?.trim() || '혜택 조건이 등록되지 않았어요.'}
              </p>
            </div>
          ) : null}
          {gradeTabs.length > 0 ? (
            <div className={allGradeCondition ? 'mt-4 border-t border-warmBorder pt-4' : ''}>
              <h3 className="text-sm font-semibold text-ink">등급별 조건</h3>
              {allGradeCondition ? (
                <p className="mt-1 text-sm leading-6 text-grey05">
                  모든 등급 조건과 중복 적용된다는 의미는 아니에요.
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="멤버십 등급 선택">
                {gradeTabs.map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    aria-pressed={activeGrade === grade}
                    onClick={() => setSelectedGrade(grade)}
                    className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-3 text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                      activeGrade === grade
                        ? 'border-brand bg-brandSoft text-brandStrong'
                        : 'border-warmBorder bg-white text-grey05 hover:bg-warmCanvas'
                    }`}
                  >
                    {getMembershipGradeLabel(grade)}
                  </button>
                ))}
              </div>
              <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-grey06">
                {!selectedConditionContext
                  ? '해당 등급의 조건이 등록되지 않았어요.'
                  : selectedConditionContext === allGradeContext
                    ? '위 모든 등급 조건과 동일하게 적용돼요.'
                    : selectedConditionContext}
              </p>
            </div>
          ) : null}
          {!allGradeCondition && gradeTabs.length === 0 ? (
            <p className="text-sm leading-6 text-grey05">등록된 등급별 혜택 조건이 없어요.</p>
          ) : null}
          {eligibilityMessage ? (
            <p className="mt-3 border-t border-warmBorder pt-3 text-sm leading-6 text-grey05">
              {eligibilityMessage}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-warmCanvas p-4 text-sm leading-6 text-grey05">
          통신사별 혜택 조건이 등록되어 있지 않아요.
        </p>
      )}
      <Link
        href={fullDetailHref}
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-brand px-4 text-sm font-semibold text-brandStrong hover:bg-brandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        전체 혜택 상세 보기
      </Link>
    </section>
  );
}
