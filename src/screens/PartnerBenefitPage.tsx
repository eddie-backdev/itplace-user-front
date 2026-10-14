'use client';

import benefitDisplay from '../content/benefit-display.json';
import partnerNotes from '../content/partner-notes.json';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from '@/lib/navigation';
import {
  TbArrowLeft,
  TbChevronDown,
  TbExternalLink,
  TbMapPin,
  TbStar,
  TbStarFilled,
} from 'react-icons/tb';
import NoResult from '../components/NoResult';
import SafeImage from '../components/SafeImage';
import NearbyStoresButton from '../features/allBenefitsPage/components/NearbyStoresButton';
import SiteFooter from '../components/SiteFooter';
import { showToast } from '../utils/toast';
import {
  addFavorite,
  CarrierBenefitDetail,
  getCarrierBenefitDisplayName,
  getPartnerBenefitDetail,
  getMembershipOptionLabel,
  getSourceOptionLabel,
  PartnerBenefitDetailResponse,
  removeFavorite,
} from '../features/allBenefitsPage/apis/allBenefitsApi';
import {
  CarrierCode,
  getCarrierGradeOrder,
  getCarrierLabel,
  getMembershipGradeLabel,
} from '../utils/membership';
import { getCarrierMembershipPath, getPartnerBenefitPath } from '../utils/partnerSeo';
import { getLoginHref } from '../features/loginPage/utils/returnTo.mjs';
import { getPartnerNoteForCarrier } from '../utils/partnerNotes';

const getUsageTypeLabel = (usageType: CarrierBenefitDetail['usageType']) => {
  if (usageType === 'ONLINE') return '온라인';
  if (usageType === 'OFFLINE') return '오프라인';
  return '온라인·오프라인';
};

const groupTierBenefitConditions = (
  tierBenefits: CarrierBenefitDetail['tierBenefits']
): Array<{ context: string; gradeLabels: string[] }> =>
  tierBenefits.reduce<Array<{ context: string; gradeLabels: string[] }>>((groups, tierBenefit) => {
    const context = tierBenefit.context?.trim();
    if (!context) return groups;

    const gradeLabel = getMembershipGradeLabel(tierBenefit.grade);
    const existingGroup = groups.find((group) => group.context === context);
    if (existingGroup) {
      if (!existingGroup.gradeLabels.includes(gradeLabel)) {
        existingGroup.gradeLabels.push(gradeLabel);
      }
      return groups;
    }

    groups.push({ context, gradeLabels: [gradeLabel] });
    return groups;
  }, []);

const PartnerBenefitPage = ({
  initialDetail = null,
  membership,
  membershipOnly = false,
}: {
  initialDetail?: PartnerBenefitDetailResponse | null;
  membership?: { carrier: CarrierCode; grade?: string };
  membershipOnly?: boolean;
}) => {
  const { partnerId: partnerIdParam, partnerSlug = '' } = useParams<{
    partnerId: string;
    partnerSlug: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const membershipCarrier = membership?.carrier ?? null;
  const membershipGrade = membership?.grade ?? null;
  const benefitsListQuery = new URLSearchParams();
  if (membershipCarrier) benefitsListQuery.set('carrier', membershipCarrier);
  if (membershipGrade) benefitsListQuery.set('grade', membershipGrade);
  if (membershipOnly) benefitsListQuery.set('membership', 'mine');
  const benefitsListHref = benefitsListQuery.size ? `/benefits?${benefitsListQuery}` : '/benefits';
  const partnerId = Number(partnerIdParam);
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const isAuthRehydrated = useSelector((state: RootState) => state._persist.rehydrated);
  const [detail, setDetail] = useState<PartnerBenefitDetailResponse | null>(initialDetail);
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierCode | null>(
    initialDetail?.carrierGroups[0]?.carrier ?? null
  );
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    initialDetail ? 'ready' : 'loading'
  );
  const [pendingFavoriteId, setPendingFavoriteId] = useState<number | null>(null);
  const [isFavoriteStateReady, setIsFavoriteStateReady] = useState(false);
  const detailRequestIdRef = useRef(0);

  const loadDetail = useCallback(
    async (showLoading = true) => {
      const requestId = ++detailRequestIdRef.current;
      setIsFavoriteStateReady(false);
      if (!Number.isInteger(partnerId) || partnerId <= 0) {
        setStatus('error');
        return;
      }

      if (showLoading) setStatus('loading');
      try {
        const response = await getPartnerBenefitDetail(
          partnerId,
          membershipCarrier
            ? { carrier: membershipCarrier, grade: membershipGrade || undefined }
            : undefined
        );
        if (requestId !== detailRequestIdRef.current) return;
        const canonicalPath = getPartnerBenefitPath(response.partnerId, response.partnerName);
        const requestedPath = `/benefits/partners/${partnerIdParam}/${partnerSlug}`;
        if (requestedPath !== canonicalPath) {
          const query = membershipCarrier
            ? new URLSearchParams({
                carrier: membershipCarrier,
                ...(membershipGrade ? { grade: membershipGrade } : {}),
                ...(membershipOnly ? { membership: 'mine' } : {}),
              }).toString()
            : '';
          navigate(`${canonicalPath}${query ? `?${query}` : ''}${location.hash}`, {
            replace: true,
          });
        }
        setDetail(response);
        setSelectedCarrier((currentCarrier) => {
          const anchoredBenefitId = window.location.hash.match(/^#benefit-(\d+)$/)?.[1];
          const anchoredGroup = anchoredBenefitId
            ? response.carrierGroups.find((group) =>
                group.benefits.some((benefit) => benefit.benefitId === Number(anchoredBenefitId))
              )
            : null;
          if (anchoredGroup) return anchoredGroup.carrier;
          if (
            currentCarrier &&
            response.carrierGroups.some((group) => group.carrier === currentCarrier)
          ) {
            return currentCarrier;
          }
          return response.carrierGroups[0]?.carrier ?? null;
        });
        setStatus('ready');
        setIsFavoriteStateReady(true);
      } catch {
        if (requestId !== detailRequestIdRef.current) return;
        setIsFavoriteStateReady(false);
        if (showLoading || !initialDetail) {
          setDetail(null);
          setStatus('error');
        }
      }
    },
    [
      initialDetail,
      navigate,
      partnerId,
      partnerIdParam,
      partnerSlug,
      location.hash,
      membershipCarrier,
      membershipGrade,
      membershipOnly,
    ]
  );

  useEffect(() => {
    if (initialDetail && !isAuthRehydrated) return;
    if (initialDetail && !isLoggedIn) {
      setDetail(initialDetail);
      setIsFavoriteStateReady(true);
      return;
    }

    void loadDetail(!initialDetail);
    return () => {
      detailRequestIdRef.current += 1;
    };
  }, [initialDetail, isAuthRehydrated, isLoggedIn, loadDetail, partnerId]);

  useEffect(() => {
    if (status !== 'ready' || !detail || !window.location.hash.startsWith('#benefit-')) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [detail, selectedCarrier, status]);

  const selectedGroup = useMemo(
    () => detail?.carrierGroups.find((group) => group.carrier === selectedCarrier) ?? null,
    [detail, selectedCarrier]
  );
  const partnerNote = getPartnerNoteForCarrier(partnerNotes, partnerId, selectedCarrier);
  const isSingleSelectedBenefit = selectedGroup?.benefits.length === 1;
  const comparisonRows =
    detail?.carrierGroups.flatMap((group) =>
      group.benefits.map((benefit) => ({
        carrier: group.carrier,
        benefit,
        conditions: groupTierBenefitConditions(benefit.tierBenefits),
      }))
    ) ?? [];

  const canonicalPath = detail
    ? getPartnerBenefitPath(detail.partnerId, detail.partnerName)
    : `/benefits/partners/${partnerIdParam}/${partnerSlug}`;
  const carrierNames = detail?.carrierGroups.map((group) => getCarrierLabel(group.carrier)) ?? [];
  const totalBenefitCount =
    detail?.carrierGroups.reduce((count, group) => count + group.benefits.length, 0) ?? 0;
  const toggleFavorite = async (benefit: CarrierBenefitDetail) => {
    if (!isFavoriteStateReady || pendingFavoriteId !== null) return;
    if (!isLoggedIn) {
      navigate(getLoginHref(`${location.pathname}${location.search}${location.hash}`));
      return;
    }
    setPendingFavoriteId(benefit.benefitId);
    try {
      if (benefit.isFavorite) {
        await removeFavorite(benefit.benefitId);
        showToast('관심 혜택에서 삭제되었습니다', 'info');
      } else {
        await addFavorite(benefit.benefitId);
        showToast('관심 혜택에 추가되었습니다', 'success');
      }
      setDetail((currentDetail) =>
        currentDetail
          ? {
              ...currentDetail,
              carrierGroups: currentDetail.carrierGroups.map((group) => ({
                ...group,
                benefits: group.benefits.map((item) =>
                  item.benefitId === benefit.benefitId
                    ? {
                        ...item,
                        isFavorite: !benefit.isFavorite,
                        favoriteCount: Math.max(
                          0,
                          item.favoriteCount + (benefit.isFavorite ? -1 : 1)
                        ),
                      }
                    : item
                ),
              })),
            }
          : currentDetail
      );
    } catch {
      showToast('관심 혜택 처리 중 오류가 발생했습니다', 'error');
    } finally {
      setPendingFavoriteId(null);
    }
  };

  return (
    <>
      <div className="flex min-h-screen min-w-0 flex-col bg-[var(--itplace-color-surface-subtle)] text-[var(--itplace-color-text)]">
        <div className="workspace-container flex-1 py-6 lg:py-8">
          <div>
            <Link
              to={benefitsListHref}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-medium text-grey05 transition-colors hover:text-brandStrong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <TbArrowLeft className="h-5 w-5" aria-hidden="true" />
              전체 혜택
            </Link>

            {membershipCarrier && membershipGrade && (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brandSoft px-4 py-2">
                <p className="text-sm text-grey06">
                  <span className="font-semibold text-ink">
                    {getCarrierLabel(membershipCarrier)} ·{' '}
                    {getMembershipGradeLabel(membershipGrade)}
                  </span>{' '}
                  조건으로 보고 있어요
                </p>
                <Link
                  to={`${canonicalPath}?carrier=${membershipCarrier}`}
                  className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-grey06 underline underline-offset-4 hover:text-brandStrong focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                >
                  모든 등급 보기
                </Link>
              </div>
            )}

            {status === 'loading' ? (
              <div className="mt-4 space-y-4" aria-label="제휴처 혜택 로딩 중">
                <div className="h-16 animate-pulse rounded-xl border border-warmBorder bg-white motion-reduce:animate-none" />
                <div className="h-11 animate-pulse rounded-xl border border-warmBorder bg-white motion-reduce:animate-none" />
                <div className="grid gap-4 md:grid-cols-2 wide:grid-cols-3">
                  <div className="h-56 animate-pulse rounded-[20px] border border-warmBorder bg-white motion-reduce:animate-none" />
                  <div className="h-56 animate-pulse rounded-[20px] border border-warmBorder bg-white motion-reduce:animate-none" />
                </div>
              </div>
            ) : null}

            {status === 'error' ? (
              <div className="mt-3 flex min-h-[360px] items-center justify-center">
                <NoResult
                  variant="error"
                  message1="제휴처 혜택을 불러오지 못했어요"
                  message2="주소를 확인하거나 잠시 후 다시 시도해 주세요."
                  buttonText="다시 시도"
                  onButtonClick={() => void loadDetail()}
                  secondaryButtonText="전체 혜택 보기"
                  onSecondaryButtonClick={() => navigate('/benefits')}
                />
              </div>
            ) : null}

            {status === 'ready' && detail?.carrierGroups.length === 0 ? (
              <NoResult
                message1="선택한 등급의 혜택을 찾지 못했어요"
                message2="혜택 조건이 바뀌었을 수 있어요. 모든 등급의 조건을 확인해 주세요."
                buttonText="모든 등급 보기"
                onButtonClick={() => navigate(`${canonicalPath}?carrier=${membershipCarrier}`)}
              />
            ) : null}

            {status === 'ready' && detail && detail.carrierGroups.length > 0 ? (
              <>
                <section className="surface-card mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-4 sm:p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--itplace-color-mint)] p-1.5">
                      <SafeImage
                        src={detail.image}
                        alt={`${detail.partnerName} 로고`}
                        width={48}
                        height={48}
                        fallbackLabel={detail.partnerName}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-balance text-[24px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[28px]">
                        {detail.partnerName} 멤버십 혜택
                      </h1>
                      <p className="mt-1.5 text-sm leading-6 text-grey05">
                        {detail.category ? `${detail.category} · ` : ''}
                        {carrierNames.join(' · ')} · 혜택 {totalBenefitCount}개
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <NearbyStoresButton
                      partner={{
                        partnerId: detail.partnerId,
                        partnerName: detail.partnerName,
                        image: detail.image,
                      }}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-brandSoft px-4 text-sm font-semibold text-brandStrong transition-colors hover:bg-[var(--itplace-color-mint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      <TbMapPin className="h-5 w-5" aria-hidden="true" />
                      주변 매장 찾기
                    </NearbyStoresButton>
                    <p className="text-sm leading-5 text-grey05">
                      방문 전 매장 적용 여부를 확인하세요.
                    </p>
                  </div>
                </section>

                <section
                  className="sticky top-0 z-20 bg-[var(--itplace-color-surface-subtle)] py-2"
                  aria-labelledby="carrier-benefit-selector"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                      <h2 id="carrier-benefit-selector" className="sr-only">
                        통신사 선택
                      </h2>
                      {detail.carrierGroups.length === 1 ? (
                        <span
                          id={`carrier-label-${detail.carrierGroups[0].carrier}`}
                          className="inline-flex min-h-11 items-center rounded-full bg-brandSoft px-4 text-sm font-semibold text-brandStrong"
                        >
                          {getCarrierLabel(detail.carrierGroups[0].carrier)}
                          <span className="ml-2 text-xs font-normal text-grey05">
                            {detail.carrierGroups[0].benefits.length}
                          </span>
                        </span>
                      ) : (
                        <div
                          className="flex flex-wrap gap-1 rounded-full border border-warmBorder bg-white p-1"
                          role="tablist"
                          aria-label="혜택 통신사 선택"
                        >
                          {detail.carrierGroups.map((group) => {
                            const isSelected = selectedCarrier === group.carrier;
                            return (
                              <button
                                key={group.carrier}
                                id={`carrier-tab-${group.carrier}`}
                                type="button"
                                role="tab"
                                aria-selected={isSelected}
                                aria-controls="selected-carrier-benefits"
                                tabIndex={isSelected ? 0 : -1}
                                onClick={() => setSelectedCarrier(group.carrier)}
                                onKeyDown={(event) => {
                                  const index = detail.carrierGroups.findIndex(
                                    (item) => item.carrier === group.carrier
                                  );
                                  const lastIndex = detail.carrierGroups.length - 1;
                                  const nextIndex =
                                    event.key === 'ArrowRight'
                                      ? (index + 1) % detail.carrierGroups.length
                                      : event.key === 'ArrowLeft'
                                        ? (index + lastIndex) % detail.carrierGroups.length
                                        : event.key === 'Home'
                                          ? 0
                                          : event.key === 'End'
                                            ? lastIndex
                                            : null;
                                  if (nextIndex === null) return;
                                  event.preventDefault();
                                  const nextCarrier = detail.carrierGroups[nextIndex].carrier;
                                  setSelectedCarrier(nextCarrier);
                                  document.getElementById(`carrier-tab-${nextCarrier}`)?.focus();
                                }}
                                className={`min-h-11 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                                  isSelected
                                    ? 'bg-brandSoft text-brandStrong'
                                    : 'text-grey05 hover:bg-[var(--itplace-color-surface-subtle)] hover:text-ink'
                                }`}
                              >
                                {getCarrierLabel(group.carrier)}
                                <span className="ml-2 text-xs font-normal text-grey05">
                                  {group.benefits.length}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {selectedGroup ? (
                      <Link
                        to={getCarrierMembershipPath(selectedGroup.carrier)}
                        className="hidden min-h-11 items-center gap-1 rounded-md px-2 text-sm font-medium text-grey05 transition-colors hover:text-brandStrong focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand sm:inline-flex"
                      >
                        {getCarrierLabel(selectedGroup.carrier)} 멤버십 안내
                        <TbExternalLink className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    ) : null}
                  </div>
                </section>

                <div
                  className={
                    isSingleSelectedBenefit && partnerNote
                      ? 'mt-5 wide:grid wide:grid-cols-[minmax(0,820px)_minmax(0,1fr)] wide:items-start wide:gap-x-8 wide:gap-y-8'
                      : ''
                  }
                >
                  <div
                    className={
                      isSingleSelectedBenefit && partnerNote
                        ? 'wide:col-start-1 wide:row-start-1'
                        : ''
                    }
                  >
                    <section
                      id="selected-carrier-benefits"
                      className={isSingleSelectedBenefit && partnerNote ? '' : 'mt-5'}
                      role={detail.carrierGroups.length > 1 ? 'tabpanel' : 'region'}
                      aria-labelledby={
                        selectedGroup
                          ? `${detail.carrierGroups.length > 1 ? 'carrier-tab' : 'carrier-label'}-${selectedGroup.carrier}`
                          : undefined
                      }
                    >
                      <div className="mb-3 flex items-end justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">
                            {selectedGroup ? getCarrierLabel(selectedGroup.carrier) : ''} 혜택 조건
                          </h2>
                        </div>
                        <span className="shrink-0 text-xs text-grey05">
                          총 {selectedGroup?.benefits.length ?? 0}개
                        </span>
                      </div>

                      <div>
                        <div
                          className={
                            isSingleSelectedBenefit
                              ? 'grid w-full max-w-[820px] gap-4'
                              : selectedGroup && selectedGroup.benefits.length < 3
                                ? 'grid items-stretch gap-4 md:grid-cols-2 wide:grid-cols-2'
                                : 'grid items-stretch gap-4 md:grid-cols-2 wide:grid-cols-3'
                          }
                        >
                          {selectedGroup?.benefits.map((benefit) => {
                            const orderedGrades = getCarrierGradeOrder(
                              selectedGroup.carrier,
                              benefit.tierBenefits.map((tierBenefit) => tierBenefit.grade)
                            );
                            const orderedTierBenefits = orderedGrades
                              .map((grade) =>
                                benefit.tierBenefits.find(
                                  (tierBenefit) => tierBenefit.grade === grade
                                )
                              )
                              .filter((tierBenefit) => tierBenefit !== undefined);
                            const conditionGroups = groupTierBenefitConditions(orderedTierBenefits);
                            const normalizedDescription = benefit.description?.trim() ?? '';
                            const hasDistinctDescription =
                              normalizedDescription.length > 0 &&
                              !conditionGroups.some(
                                (group) => group.context === normalizedDescription
                              );
                            const hasUsageDetails =
                              hasDistinctDescription || Boolean(benefit.manual);

                            return (
                              <article
                                key={benefit.benefitId}
                                id={`benefit-${benefit.benefitId}`}
                                className="surface-card scroll-mt-28 flex h-full min-w-0 flex-col p-4 sm:p-5"
                              >
                                <header className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm font-medium text-grey05">
                                        {getUsageTypeLabel(benefit.usageType)}
                                      </span>
                                    </div>
                                    <h3 className="mt-1.5 text-balance text-lg font-semibold leading-snug tracking-[-0.015em] text-ink">
                                      {getCarrierBenefitDisplayName(benefit)}
                                    </h3>
                                    {getMembershipOptionLabel(benefit) && (
                                      <span className="mt-1.5 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                        {getMembershipOptionLabel(benefit)}
                                      </span>
                                    )}
                                    {getSourceOptionLabel(benefit) && (
                                      <p className="mt-1 text-xs leading-5 text-grey05">
                                        원본 선택명: {getSourceOptionLabel(benefit)}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    aria-label={
                                      !isFavoriteStateReady
                                        ? '관심 혜택 상태 확인 중'
                                        : benefit.isFavorite
                                          ? '관심 혜택에서 제거'
                                          : '관심 혜택에 추가'
                                    }
                                    disabled={
                                      !isFavoriteStateReady ||
                                      pendingFavoriteId === benefit.benefitId
                                    }
                                    onClick={() => void toggleFavorite(benefit)}
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-accentGoldDark transition-colors hover:bg-grey01 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50"
                                  >
                                    {benefit.isFavorite ? (
                                      <TbStarFilled className="h-5 w-5" aria-hidden="true" />
                                    ) : (
                                      <TbStar className="h-5 w-5" aria-hidden="true" />
                                    )}
                                  </button>
                                </header>

                                <div className="mt-4 flex flex-1 flex-col gap-3">
                                  {conditionGroups.length > 0 ? (
                                    <dl className="divide-y divide-warmBorder">
                                      {conditionGroups.map((conditionGroup) => (
                                        <div
                                          key={`${benefit.benefitId}-${conditionGroup.context}`}
                                          className="grid gap-1.5 py-3 sm:grid-cols-[136px_minmax(0,1fr)]"
                                        >
                                          <dt className="flex flex-col items-start gap-1.5">
                                            <span className="text-sm font-medium text-grey05">
                                              적용 등급
                                            </span>
                                            <span className="flex flex-wrap gap-1">
                                              {conditionGroup.gradeLabels.map((gradeLabel) => (
                                                <span
                                                  key={gradeLabel}
                                                  className="rounded-full bg-brandSoft px-2 py-0.5 text-xs font-medium text-brandStrong"
                                                >
                                                  {gradeLabel}
                                                </span>
                                              ))}
                                            </span>
                                          </dt>
                                          <dd className="max-w-[68ch] whitespace-pre-line break-words text-base leading-7 text-ink">
                                            <span className="mb-1 block text-sm font-medium text-grey05">
                                              혜택 내용
                                            </span>
                                            {conditionGroup.context}
                                          </dd>
                                        </div>
                                      ))}
                                    </dl>
                                  ) : benefit.description ? (
                                    <div>
                                      <span className="mb-1 block text-sm font-medium text-grey05">
                                        혜택 내용
                                      </span>
                                      <p className="max-w-[68ch] whitespace-pre-line break-words text-base leading-7 text-ink">
                                        {benefit.description}
                                      </p>
                                    </div>
                                  ) : null}

                                  {benefit.benefitLimit ? (
                                    <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 py-1">
                                      <dt className="text-sm font-medium text-grey05">이용 한도</dt>
                                      <dd className="whitespace-pre-line break-words text-[15px] leading-6 text-grey06">
                                        {benefit.benefitLimit}
                                      </dd>
                                    </dl>
                                  ) : null}

                                  {hasUsageDetails ? (
                                    <details className="group border-t border-warmBorder">
                                      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-md text-sm font-medium text-grey06 marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
                                        이용 방법·추가 조건
                                        <TbChevronDown
                                          className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180"
                                          aria-hidden="true"
                                        />
                                      </summary>
                                      <div className="pb-3 text-[15px] leading-7 text-grey06">
                                        {hasDistinctDescription ? (
                                          <p className="max-w-[76ch] whitespace-pre-line break-words text-grey07">
                                            {benefit.description}
                                          </p>
                                        ) : null}
                                        {benefit.manual ? (
                                          <p
                                            className={`max-w-[76ch] whitespace-pre-line break-words ${
                                              hasDistinctDescription ? 'mt-3' : ''
                                            }`}
                                          >
                                            {benefit.manual}
                                          </p>
                                        ) : null}
                                      </div>
                                    </details>
                                  ) : null}

                                  {selectedGroup ? (
                                    <a
                                      href={
                                        benefit.sourceUrl ||
                                        benefit.url ||
                                        benefitDisplay.carrierSources[selectedGroup.carrier].url
                                      }
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-auto inline-flex min-h-11 items-center gap-1.5 self-start rounded-md text-sm font-medium text-brandStrong transition-colors hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                                    >
                                      {benefit.sourceUrl
                                        ? '통신사 공식 원문 확인'
                                        : benefit.url
                                          ? '혜택 제공처 안내 확인'
                                          : benefitDisplay.carrierSources[selectedGroup.carrier]
                                              .label}
                                      <TbExternalLink className="h-5 w-5" aria-hidden="true" />
                                    </a>
                                  ) : null}
                                  <Link
                                    to={`/mypage/activity?benefitId=${benefit.benefitId}`}
                                    className="inline-flex min-h-11 items-center self-start rounded-md border border-brand px-3 text-sm font-semibold text-brandStrong transition-colors hover:bg-brandSoft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                                  >
                                    사용 기록 남기기
                                  </Link>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </div>
                    </section>
                    {partnerNote ? (
                      <section
                        className={`mt-5 max-w-[820px] ${
                          isSingleSelectedBenefit ? 'wide:mt-5 wide:max-w-[820px]' : ''
                        }`}
                        aria-labelledby="partner-payment-checks"
                      >
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <h2
                            id="partner-payment-checks"
                            className="text-base font-semibold text-ink"
                          >
                            주문 전에 확인할 세 가지
                          </h2>
                          <p className="text-sm text-grey05">{partnerNote.scope}</p>
                        </div>
                        <ul className="mt-2 grid gap-2 text-[15px] leading-7 text-grey06 sm:grid-cols-3">
                          {partnerNote.checks.map((check) => (
                            <li key={check} className="flex gap-2">
                              <span
                                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                                aria-hidden="true"
                              />
                              {check}
                            </li>
                          ))}
                        </ul>
                      </section>
                    ) : null}
                  </div>
                  <section
                    className={`surface-card mt-8 p-4 sm:p-5 ${
                      isSingleSelectedBenefit && partnerNote
                        ? 'wide:col-span-2 wide:row-start-2 wide:mt-0'
                        : ''
                    }`}
                    aria-labelledby="carrier-comparison"
                  >
                    <h2 id="carrier-comparison" className="text-lg font-semibold text-ink">
                      {membershipGrade
                        ? '내 등급의 혜택 조건'
                        : membershipCarrier
                          ? `${getCarrierLabel(membershipCarrier)} 혜택 조건`
                          : '통신사별 조건 한눈에 비교'}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-grey05">
                      같은 등급 이름이라도 통신사별 적용 조건은 다릅니다. 내 통신사·등급의 조건과
                      실제 이용 방법을 함께 확인하세요.
                    </p>
                    <div className="mt-4 divide-y divide-warmBorder md:hidden">
                      {comparisonRows.map(({ carrier, benefit, conditions }) => (
                        <article
                          key={`${carrier}-${benefit.benefitId}`}
                          className="py-4 first:pt-0 last:pb-0"
                        >
                          <p className="text-xs font-semibold text-brandStrong">
                            {getCarrierLabel(carrier)}
                          </p>
                          <h3 className="mt-1 text-sm font-semibold leading-6 text-ink">
                            {getCarrierBenefitDisplayName(benefit)}
                          </h3>
                          {getMembershipOptionLabel(benefit) && (
                            <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                              {getMembershipOptionLabel(benefit)}
                            </span>
                          )}
                          {getSourceOptionLabel(benefit) && (
                            <p className="mt-1 text-xs leading-5 text-grey05">
                              원본 선택명: {getSourceOptionLabel(benefit)}
                            </p>
                          )}
                          <dl className="mt-3 space-y-3 text-sm leading-6">
                            <div>
                              <dt className="font-medium text-grey05">등급별 조건</dt>
                              <dd className="mt-1 whitespace-pre-line break-words text-grey06">
                                {conditions.length === 0 ? (
                                  <p>
                                    {benefit.description ||
                                      '등급별 조건은 공식 안내에서 확인하세요.'}
                                  </p>
                                ) : null}
                                {conditions.map((condition) => (
                                  <p key={condition.context} className="mt-1 first:mt-0">
                                    <strong className="font-semibold">
                                      {condition.gradeLabels.join(' · ')}
                                    </strong>
                                    : {condition.context}
                                  </p>
                                ))}
                              </dd>
                            </div>
                            <div>
                              <dt className="font-medium text-grey05">이용 제한</dt>
                              <dd className="mt-1 whitespace-pre-line break-words text-grey06">
                                {benefit.benefitLimit || '이용 방법 확인'}
                              </dd>
                            </div>
                          </dl>
                        </article>
                      ))}
                    </div>
                    <div
                      className="mt-4 hidden max-w-[1600px] overflow-x-auto rounded-xl border border-warmBorder bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:block"
                      role="region"
                      aria-label="통신사별 혜택 비교표"
                      tabIndex={0}
                    >
                      <table className="w-full min-w-[560px] border-collapse text-left text-sm leading-6">
                        <caption className="sr-only">
                          {detail.partnerName} 통신사별 혜택과 이용 제한
                        </caption>
                        <thead className="bg-grey01 text-ink">
                          <tr>
                            <th scope="col" className="p-3">
                              통신사
                            </th>
                            <th scope="col" className="p-3">
                              혜택
                            </th>
                            <th scope="col" className="p-3">
                              등급별 조건
                            </th>
                            <th scope="col" className="p-3">
                              이용 제한
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonRows.map(({ carrier, benefit, conditions }) => (
                            <tr
                              key={`${carrier}-${benefit.benefitId}`}
                              className="scroll-mt-28 border-b border-grey02 align-top"
                            >
                              <th scope="row" className="whitespace-nowrap p-3 font-bold">
                                {getCarrierLabel(carrier)}
                              </th>
                              <td className="p-3">
                                {getCarrierBenefitDisplayName(benefit)}
                                {getMembershipOptionLabel(benefit) && (
                                  <span className="ml-2 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                    {getMembershipOptionLabel(benefit)}
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                {conditions.length === 0 ? (
                                  <p>
                                    {benefit.description ||
                                      '등급별 조건은 공식 안내에서 확인하세요.'}
                                  </p>
                                ) : null}
                                {conditions.map((condition) => (
                                  <p key={condition.context}>
                                    <strong>{condition.gradeLabels.join(' · ')}</strong>:{' '}
                                    {condition.context}
                                  </p>
                                ))}
                              </td>
                              <td className="p-3">{benefit.benefitLimit || '이용 방법 확인'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {partnerNote ? (
                    <section
                      className={`surface-card mt-8 p-4 sm:p-5 ${
                        isSingleSelectedBenefit && partnerNote
                          ? 'wide:col-start-2 wide:row-start-1 wide:mt-0'
                          : ''
                      }`}
                      aria-labelledby="partner-editorial-note"
                    >
                      <p className="text-sm font-medium text-grey05">{partnerNote.scope}</p>
                      <h2
                        id="partner-editorial-note"
                        className="mt-2 scroll-mt-24 max-w-[48ch] text-balance text-lg font-semibold leading-snug text-ink"
                      >
                        {partnerNote.title}
                      </h2>
                      <div
                        className={`mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] ${
                          isSingleSelectedBenefit && partnerNote ? 'wide:grid-cols-1' : ''
                        }`}
                      >
                        <div className="max-w-[70ch] space-y-3 text-[15px] leading-7 text-grey06">
                          {partnerNote.paragraphs.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                          ))}
                        </div>
                        <aside
                          className="rounded-xl bg-[var(--itplace-color-lavender)] p-4"
                          aria-label="이용 상황 예시"
                        >
                          <h3 className="text-base font-semibold text-ink">
                            {partnerNote.example.title}
                          </h3>
                          <p className="mt-3 text-[15px] leading-7 text-grey06">
                            {partnerNote.example.body}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-grey05">
                            {partnerNote.example.note}
                          </p>
                        </aside>
                      </div>
                      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm leading-6 text-grey05">
                        <p>
                          해설의 공식 안내 확인일{' '}
                          <time dateTime={partnerNote.checkedAt}>{partnerNote.checkedAt}</time>
                        </p>
                        {[
                          { label: partnerNote.sourceLabel, url: partnerNote.sourceUrl },
                          ...(partnerNote.additionalSources ?? []),
                        ].map((source) => (
                          <a
                            key={source.url}
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-11 items-center gap-1 rounded-md font-bold text-brandStrong underline underline-offset-4 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                          >
                            {source.label}
                            <TbExternalLink className="h-4 w-4" aria-hidden="true" />
                          </a>
                        ))}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-grey05">
                        확인일은 이 해설의 기준입니다. 위 비교표 전체의 갱신일을 뜻하지 않습니다.
                      </p>
                    </section>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>
        <SiteFooter />
      </div>
    </>
  );
};

export default PartnerBenefitPage;
