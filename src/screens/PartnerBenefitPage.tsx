'use client';

import benefitDisplay from '../content/benefit-display.json';
import partnerNotes from '../content/partner-notes.json';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useClientReady } from '../hooks/useClientReady';
import { Link, useLocation, useNavigate, useParams } from '@/lib/navigation';
import { TbChevronDown, TbExternalLink, TbMapPin, TbStar, TbStarFilled } from 'react-icons/tb';
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
  PartnerBenefitDetailResponse,
  removeFavorite,
} from '../features/allBenefitsPage/apis/allBenefitsApi';
import {
  getApplicableTierBenefits,
  hasEligibleStructuredOffer,
  hasStructuredOffers,
  mergePartnerBenefitDetails,
} from '../features/allBenefitsPage/apis/partnerBenefitModel';
import {
  getEffectiveBenefitUsageType,
  hasKnownStores,
} from '../features/allBenefitsPage/apis/benefitChannelFacts.mjs';
import {
  CarrierCode,
  getCarrierLabel,
  getBenefitMembershipGradeOptions,
  getMembershipGradeLabel,
  isGradeApplicableToProfile,
} from '../utils/membership';
import { getPartnerBenefitPath } from '../utils/partnerSeo';
import { isCanonicalPartnerSlug } from '../utils/partnerSlug.mjs';
import { getLoginHref } from '../features/loginPage/utils/returnTo.mjs';
import MembershipSelectionDialog from '@/components/membership/MembershipSelectionDialog';
import PartnerBenefitComparison from './PartnerBenefitComparison';
import BenefitConditions from '../features/allBenefitsPage/components/BenefitConditions';
import { getScopedBenefitHeadline } from './partnerBenefitHeadline.mjs';
import styles from './PartnerBenefitPage.module.css';
import { useReferenceData } from '@/components/ReferenceDataProvider';
import { getCategoryLabel } from '@/utils/referenceData';

const getManualExcerpt = (manual?: string | null) => {
  const text = manual?.trim() ?? '';
  if (text.length <= 180) return text;
  const firstSentence = text.match(/^(.+?[.!?。！？])(?=\s|$)/s)?.[1];
  if (firstSentence && firstSentence.length <= 220) return firstSentence;
  const boundary = text.lastIndexOf(' ', 180);
  return `${text.slice(0, boundary > 0 ? boundary : 180).trim()}…`;
};

// 공식 출처·현재 통신사 데이터 대조 기록: docs/content/partner-notes-verification-2026-10-24.md
const VERIFIED_PARTNER_NOTE_IDS = new Set<number>([17, 21, 30, 93, 108, 112, 131, 287, 288, 291]);

const groupTierBenefitConditions = (
  tierBenefits: CarrierBenefitDetail['tierBenefits'],
  referenceData?: import('@/utils/referenceData').ReferenceData | null
): Array<{ context: string; gradeLabels: string[] }> =>
  tierBenefits.reduce<Array<{ context: string; gradeLabels: string[] }>>((groups, tierBenefit) => {
    const context = tierBenefit.context?.trim();
    if (!context) return groups;

    const gradeLabel = tierBenefit.isAll
      ? '전체 등급'
      : getMembershipGradeLabel(tierBenefit.grade, referenceData);
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
  comparisonDetail = null,
  membership,
  membershipOnly = false,
}: {
  initialDetail?: PartnerBenefitDetailResponse | null;
  comparisonDetail?: PartnerBenefitDetailResponse | null;
  membership?: { carrier: CarrierCode; grade?: string };
  membershipOnly?: boolean;
}) => {
  const { data: referenceData } = useReferenceData();
  const { partnerId: partnerIdParam, partnerSlug = '' } = useParams<{
    partnerId: string;
    partnerSlug: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const membershipCarrier = membership?.carrier ?? null;
  const membershipGrade = membership?.grade ?? null;
  const isClientReady = useClientReady();
  const benefitsListQuery = new URLSearchParams();
  if (membershipCarrier) benefitsListQuery.set('carrier', membershipCarrier);
  if (membershipGrade) benefitsListQuery.set('grade', membershipGrade);
  if (membershipOnly) benefitsListQuery.set('membership', 'mine');
  const benefitsListHref = benefitsListQuery.size ? `/benefits?${benefitsListQuery}` : '/benefits';
  const partnerId = Number(partnerIdParam);
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const isAuthRehydrated = useSelector((state: RootState) => state._persist.rehydrated);
  const isAuthReady = isClientReady && isAuthRehydrated;
  const [detail, setDetail] = useState<PartnerBenefitDetailResponse | null>(() =>
    mergePartnerBenefitDetails(comparisonDetail, initialDetail)
  );
  const [allCarrierDetail, setAllCarrierDetail] = useState<PartnerBenefitDetailResponse | null>(
    comparisonDetail ?? initialDetail
  );
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierCode | null>(
    membershipCarrier ??
      initialDetail?.carrierGroups[0]?.carrier ??
      comparisonDetail?.carrierGroups[0]?.carrier ??
      null
  );
  const [selectedBenefitId, setSelectedBenefitId] = useState<number | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    initialDetail || comparisonDetail ? 'ready' : 'loading'
  );
  const [pendingFavoriteId, setPendingFavoriteId] = useState<number | null>(null);
  const [isMembershipDialogOpen, setIsMembershipDialogOpen] = useState(false);
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
        const [selectedResponse, canonicalResponse] = await Promise.all([
          getPartnerBenefitDetail(
            partnerId,
            membershipCarrier
              ? { carrier: membershipCarrier, grade: membershipGrade ?? undefined }
              : undefined
          ),
          membershipCarrier
            ? getPartnerBenefitDetail(partnerId).catch(() => null)
            : Promise.resolve(null),
        ]);
        const allResponse = canonicalResponse ?? selectedResponse;
        const response =
          mergePartnerBenefitDetails(allResponse, selectedResponse) ?? selectedResponse;
        if (requestId !== detailRequestIdRef.current) return;
        const canonicalPath = getPartnerBenefitPath(response.partnerId, response.partnerName);
        if (
          String(response.partnerId) !== partnerIdParam ||
          !isCanonicalPartnerSlug(
            partnerSlug,
            canonicalPath.slice(canonicalPath.lastIndexOf('/') + 1)
          )
        ) {
          navigate(`${canonicalPath}${window.location.search}${window.location.hash}`, {
            replace: true,
          });
        }
        setDetail(response);
        setAllCarrierDetail(allResponse);
        setSelectedCarrier((currentCarrier) => {
          if (
            membershipCarrier &&
            response.carrierGroups.some((group) => group.carrier === membershipCarrier)
          ) {
            return membershipCarrier;
          }
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
        if (showLoading || (!initialDetail && !comparisonDetail)) {
          setDetail(null);
          setStatus('error');
        }
      }
    },
    [
      comparisonDetail,
      initialDetail,
      navigate,
      partnerId,
      partnerIdParam,
      partnerSlug,
      membershipCarrier,
      membershipGrade,
    ]
  );

  useEffect(() => {
    if (!isAuthReady) return;
    void loadDetail(!initialDetail);
    return () => {
      detailRequestIdRef.current += 1;
    };
  }, [initialDetail, isAuthReady, isLoggedIn, loadDetail, partnerId]);

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
  const selectedGrade =
    (membershipCarrier === selectedGroup?.carrier ? membershipGrade : null) ??
    (selectedGroup
      ? (getBenefitMembershipGradeOptions(selectedGroup.carrier, referenceData).find((option) =>
          selectedGroup.benefits.some(
            (benefit) =>
              hasStructuredOffers(benefit.conditions)
                ? hasEligibleStructuredOffer(benefit.conditions, selectedGroup.carrier, option.code, referenceData)
                : getApplicableTierBenefits(benefit.tierBenefits, selectedGroup.carrier, option.code).length > 0
          )
        )?.code ??
        getBenefitMembershipGradeOptions(selectedGroup.carrier, referenceData)[0]?.code ??
        null)
      : null);
  const matchingBenefits = useMemo(
    () =>
      selectedGroup?.benefits.filter(
        (benefit) => {
          if (hasStructuredOffers(benefit.conditions)) {
            return (
              benefit.conditions?.offerResolution === 'UNRESOLVED' ||
              hasEligibleStructuredOffer(benefit.conditions, selectedGroup.carrier, selectedGrade, referenceData)
            );
          }
          return (
            benefit.tierBenefits.length === 0 ||
            getApplicableTierBenefits(benefit.tierBenefits, selectedGroup.carrier, selectedGrade).length > 0
          );
        }
      ) ?? [],
    [referenceData, selectedGrade, selectedGroup]
  );

  useEffect(() => {
    if (!selectedGroup) {
      setSelectedBenefitId(null);
      return;
    }
    const anchoredId = Number(window.location.hash.match(/^#benefit-(\d+)$/)?.[1]);
    const next = matchingBenefits.find(({ benefitId }) => benefitId === anchoredId)?.benefitId;
    setSelectedBenefitId(
      (current) =>
        next ??
        (current && matchingBenefits.some(({ benefitId }) => benefitId === current)
          ? current
          : (matchingBenefits[0]?.benefitId ?? null))
    );
  }, [matchingBenefits, location.hash, selectedGroup]);
  const selectedBenefit =
    matchingBenefits.find(({ benefitId }) => benefitId === selectedBenefitId) ??
    matchingBenefits[0] ??
    null;
  const effectiveUsageType = selectedBenefit
    ? getEffectiveBenefitUsageType(
        detail?.partnerId ?? 0,
        selectedGroup?.carrier ?? '',
        selectedBenefit.usageType
      )
    : 'UNKNOWN';
  const gradeOptions = selectedGroup
    ? getBenefitMembershipGradeOptions(selectedGroup.carrier, referenceData)
    : [];
  const dialogCarrier =
    selectedCarrier ?? membershipCarrier ?? detail?.carrierGroups[0]?.carrier ?? 'SKT';
  const dialogGrade =
    (membershipCarrier === dialogCarrier ? membershipGrade : null) ??
    getBenefitMembershipGradeOptions(dialogCarrier, referenceData)[0]?.code ??
    '';

  const canonicalPath = detail
    ? getPartnerBenefitPath(detail.partnerId, detail.partnerName)
    : `/benefits/partners/${partnerIdParam}/${partnerSlug}`;
  const changeMembership = (carrier: CarrierCode, grade?: string | null) => {
    const query = new URLSearchParams({ carrier });
    if (grade) query.set('grade', grade);
    navigate(`${canonicalPath}?${query}${location.hash}`, { replace: true });
  };
  const selectBenefit = (benefitId: number) => {
    setSelectedBenefitId(benefitId);
    window.history.replaceState(
      window.history.state,
      '',
      `${location.pathname}${location.search}#benefit-${benefitId}`
    );
  };
  const toggleFavorite = async (benefit: CarrierBenefitDetail) => {
    if (!isAuthReady || pendingFavoriteId !== null) return;
    if (!isLoggedIn) {
      navigate(getLoginHref(`${location.pathname}${location.search}#benefit-${benefit.benefitId}`));
      return;
    }
    if (!isFavoriteStateReady) return;
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

  const selectedConditions = selectedBenefit
    ? groupTierBenefitConditions(
        getApplicableTierBenefits(
          selectedBenefit.tierBenefits,
          selectedGroup?.carrier,
          selectedGrade
        ),
        referenceData
      )
    : [];
  const hasScopedOffers = Boolean(
    selectedBenefit?.conditions?.offers?.length || selectedBenefit?.conditions?.offerResolution
  );
  const selectedOffers = selectedBenefit?.conditions?.offerResolution !== 'UNRESOLVED'
    ? selectedBenefit?.conditions?.offers?.filter(
    (offer) =>
      offer.allGrades === true ||
      Boolean(
        selectedGroup &&
          selectedGrade &&
          offer.gradeCodes.some((benefitGrade) =>
            isGradeApplicableToProfile({
              benefitCarrier: selectedGroup.carrier,
              benefitGrade,
              userCarrier: selectedGroup.carrier,
              userGrade: selectedGrade,
              referenceData,
            })
          )
      )
      ) ?? []
    : [];
  const [conditionHeadline = '', ...conditionNotes] =
    selectedConditions[0]?.context.split('※') ?? [];
  const selectedBenefitHeadline =
    hasScopedOffers
      ? getScopedBenefitHeadline({
          offers: selectedOffers,
          offerResolution: selectedBenefit?.conditions?.offerResolution,
          eligibleTierContexts: selectedConditions.map(({ context }) => context.trim()).filter(Boolean),
        })
      : conditionHeadline
          .trim()
          .replace(detail?.partnerName ?? '', '')
          .trim() || (selectedBenefit ? getCarrierBenefitDisplayName(selectedBenefit) : '');
  const selectedBenefitSupport =
    hasScopedOffers
      ? selectedOffers.length
        ? selectedBenefit?.conditions?.offerResolution === 'SINGLE' && !selectedConditions.length
          ? '선택 등급의 구체적인 혜택 내용은 확인되지 않았어요. 안내 원문을 확인해 주세요.'
          : null
        : '적용 등급이 확인되지 않은 혜택은 공식 조건을 확인해 주세요.'
      : conditionNotes.join(' · ').trim() ||
        (!selectedConditions.length && selectedBenefit?.description !== selectedBenefitHeadline
          ? selectedBenefit?.description
          : null);
  const manualText = selectedBenefit?.manual ?? '';
  const manualExcerpt = getManualExcerpt(manualText);
  const sourceHref =
    selectedBenefit?.sourceUrl ||
    selectedBenefit?.url ||
    (selectedGroup ? benefitDisplay.carrierSources[selectedGroup.carrier].url : null);
  const note = partnerNotes.find(
    (item) =>
      item.partnerId === detail?.partnerId &&
      item.carrier === selectedGroup?.carrier &&
      VERIFIED_PARTNER_NOTE_IDS.has(item.partnerId)
  );

  return (
    <div className={styles.page}>
      <div className={styles.workspace}>
        <nav aria-label="현재 위치" className={styles.breadcrumbs}>
          <Link to="/">발견하기</Link>
          <span aria-hidden="true">/</span>
          <Link to={benefitsListHref}>혜택찾기</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{detail?.partnerName ?? partnerSlug}</span>
        </nav>

        {status === 'loading' ? (
          <div aria-label="제휴처 혜택 로딩 중" className={styles.loading}>
            <div />
            <div />
            <div />
          </div>
        ) : null}

        {status === 'error' ? (
          <div className={styles.error}>
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
            onButtonClick={() => navigate(canonicalPath)}
          />
        ) : null}
        {status === 'ready' && detail && selectedGroup && !selectedBenefit ? (
          <NoResult
            message1="선택한 등급의 혜택을 찾지 못했어요"
            message2="다른 등급이나 혜택 유형을 선택해 보세요."
            buttonText="다른 등급 선택"
            onButtonClick={() => setIsMembershipDialogOpen(true)}
          />
        ) : null}

        {status === 'ready' && detail && selectedGroup && selectedBenefit ? (
          <div className={styles.detailLayout}>
            <div className={styles.mainColumn}>
              <section className={styles.hero} aria-labelledby="partner-name">
                <div className={styles.partnerIdentity}>
                  <div className={styles.partnerLogo}>
                    <SafeImage
                      src={detail.image}
                      alt={detail.partnerName + ' 로고'}
                      width={64}
                      height={64}
                      fallbackLabel={detail.partnerName}
                      className={styles.partnerLogoImage}
                    />
                  </div>
                  <div className={styles.partnerCopy}>
                    <h1 id="partner-name">{detail.partnerName}</h1>
                    <p>
                      {[
                        getCategoryLabel(detail.category, referenceData),
                        getCarrierLabel(selectedGroup.carrier),
                        getMembershipGradeLabel(selectedGrade ?? '', referenceData),
                        '멤버십',
                        getMembershipOptionLabel(selectedBenefit),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                </div>
                <div className={styles.heroBenefit}>
                  <p>{selectedBenefitHeadline}</p>
                  {selectedBenefitSupport ? <span>{selectedBenefitSupport}</span> : null}
                </div>
              </section>

              <section aria-label="혜택 조건 선택" className={styles.selectors}>
                <label>
                  <span>통신사</span>
                  <select
                    value={selectedGroup.carrier}
                    onChange={(event) => {
                      const carrier = event.target.value as CarrierCode;
                      const firstGrade = getBenefitMembershipGradeOptions(carrier, referenceData)[0]
                        ?.code;
                      changeMembership(carrier, firstGrade);
                    }}
                  >
                    {detail.carrierGroups.map((group) => (
                      <option key={group.carrier} value={group.carrier}>
                        {getCarrierLabel(group.carrier)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>등급</span>
                  <select
                    value={selectedGrade ?? ''}
                    onChange={(event) =>
                      changeMembership(selectedGroup.carrier, event.target.value)
                    }
                  >
                    {gradeOptions.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>혜택 유형</span>
                  <select
                    value={selectedBenefit.benefitId}
                    onChange={(event) => selectBenefit(Number(event.target.value))}
                  >
                    {matchingBenefits.map((benefit) => (
                      <option key={benefit.benefitId} value={benefit.benefitId}>
                        {getMembershipOptionLabel(benefit)
                          ? getMembershipOptionLabel(benefit) + ' · '
                          : ''}
                        {getCarrierBenefitDisplayName(benefit)}
                      </option>
                    ))}
                  </select>
                </label>
              </section>

              <section
                id={`benefit-${selectedBenefit.benefitId}`}
                className={styles.contentSection}
                aria-labelledby="benefit-conditions"
              >
                <h2 id="benefit-conditions">이용 조건</h2>
                <BenefitConditions
                  conditions={selectedBenefit.conditions}
                  legacyLimit={selectedBenefit.benefitLimit}
                  sourceUrl={selectedBenefit.sourceUrl ?? sourceHref}
                  sourceCapturedAt={selectedBenefit.sourceCapturedAt}
                  usageType={effectiveUsageType}
                  carrier={selectedGroup.carrier}
                  grade={selectedGrade}
                  tierConditions={
                    selectedConditions.length > 0
                      ? selectedConditions.map((condition) => ({
                          grades: condition.gradeLabels,
                          context: condition.context,
                        }))
                      : !hasStructuredOffers(selectedBenefit?.conditions) && selectedBenefit.description
                        ? [{ grades: [], context: selectedBenefit.description }]
                        : []
                  }
                  className={styles.conditionList}
                />
              </section>

              <section className={styles.contentSection} aria-labelledby="benefit-usage">
                {note ? (
                  <section className={styles.verifiedNote} aria-labelledby="verified-note-title">
                    <h3 id="verified-note-title">{note.title}</h3>
                    {note.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    <strong>{note.example.title}</strong>
                    <p>{note.example.body}</p>
                    <p>{note.example.note}</p>
                    <ul>
                      {note.checks.map((check) => (
                        <li key={check}>{check}</li>
                      ))}
                    </ul>
                    <a href={note.sourceUrl} target="_blank" rel="noreferrer">
                      {note.sourceLabel} · {note.checkedAt} 확인
                    </a>
                  </section>
                ) : null}
                <h2 id="benefit-usage">이용 방법</h2>
                <div className={styles.usagePanel}>
                  {manualExcerpt ? (
                    <p className={styles.manual}>{manualExcerpt}</p>
                  ) : !hasScopedOffers &&
                    !selectedConditions.length &&
                    selectedBenefit.description &&
                    selectedBenefit.description !== selectedBenefitHeadline ? (
                    <p className={styles.manual}>{selectedBenefit.description}</p>
                  ) : selectedBenefit.manual ? (
                    <p className={styles.sourceDisclaimer}>
                      등록된 이용 방법은 아래 제휴사 안내 원문에서 확인할 수 있어요.
                    </p>
                  ) : (
                    <p className={styles.sourceDisclaimer}>
                      구체적인 이용 방법은 확인되지 않았어요. 사용 전에 통신사 또는 제휴사의 안내를
                      확인해 주세요.
                    </p>
                  )}
                </div>
                {manualText.length > manualExcerpt.length ? (
                  <details className={styles.sourceDetails}>
                    <summary>
                      제휴사 안내 원문 전체 보기
                      <TbChevronDown aria-hidden="true" />
                    </summary>
                    <p>{manualText}</p>
                  </details>
                ) : null}
                <p className={styles.sourceNote}>
                  조건과 방법은 변경될 수 있으니 사용 전 공식 안내 원문을 확인해 주세요.
                </p>
                {!sourceHref ? (
                  <p className={styles.noSource}>확인 가능한 공식 안내 링크가 제공되지 않았어요.</p>
                ) : null}
              </section>

              {hasKnownStores(detail.hasStores) ? (
                <section className={styles.contentSection} aria-labelledby="related-stores">
                  <h2 id="related-stores">관련 매장</h2>
                  <p className={styles.relatedDescription}>
                    {detail.partnerName} 매장 위치를 확인할 수 있어요.
                  </p>
                  <NearbyStoresButton
                    partner={{
                      partnerId: detail.partnerId,
                      partnerName: detail.partnerName,
                      image: detail.image,
                    }}
                    className={styles.storeButton}
                  >
                    <TbMapPin aria-hidden="true" /> 매장 찾기
                  </NearbyStoresButton>
                </section>
              ) : null}
            </div>

            <aside className={styles.summary} aria-labelledby="membership-summary">
              <h2 id="membership-summary">
                {membershipCarrier === selectedGroup.carrier && membershipGrade === selectedGrade
                  ? '내 멤버십 혜택'
                  : '선택한 멤버십 혜택'}
              </h2>
              <p className={styles.summaryBenefit}>{selectedBenefitHeadline}</p>
              <p className={styles.summaryMembership}>
                {getCarrierLabel(selectedGroup.carrier)} ·{' '}
                {getMembershipGradeLabel(selectedGrade ?? '', referenceData)}
              </p>
              <PartnerBenefitComparison detail={allCarrierDetail} />
              <div className={styles.summaryActions}>
                <button
                  type="button"
                  aria-pressed={selectedBenefit.isFavorite}
                  aria-label={selectedBenefit.isFavorite ? '관심 혜택 해제' : '관심 혜택 추가'}
                  disabled={
                    !isAuthReady ||
                    (isLoggedIn && !isFavoriteStateReady) ||
                    pendingFavoriteId === selectedBenefit.benefitId
                  }
                  onClick={() => void toggleFavorite(selectedBenefit)}
                  className={styles.saveButton}
                >
                  {selectedBenefit.isFavorite ? (
                    <TbStarFilled aria-hidden="true" />
                  ) : (
                    <TbStar aria-hidden="true" />
                  )}
                  {selectedBenefit.isFavorite ? '관심 혜택 해제' : '관심 혜택 추가'}
                </button>
                <button
                  type="button"
                  className={styles.changeButton}
                  onClick={() => setIsMembershipDialogOpen(true)}
                >
                  멤버십 변경
                </button>
              </div>
              {sourceHref ? (
                <a
                  className={styles.officialLink}
                  href={sourceHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  공식 안내 원문 확인 <TbExternalLink aria-hidden="true" />
                </a>
              ) : (
                <p className={styles.noSource}>확인 가능한 공식 안내 링크가 제공되지 않았어요.</p>
              )}
              <p className={styles.summaryNote}>
                조건을 확인한 시점과 제휴사 안내가 다를 수 있어요.
              </p>
            </aside>
          </div>
        ) : null}
      </div>
      <MembershipSelectionDialog
        isOpen={isMembershipDialogOpen}
        carrier={dialogCarrier}
        grade={dialogGrade}
        onClose={() => setIsMembershipDialogOpen(false)}
        onApply={(carrier, grade) => {
          setIsMembershipDialogOpen(false);
          changeMembership(carrier as CarrierCode, grade);
        }}
      />
      <SiteFooter />
    </div>
  );
};

export default PartnerBenefitPage;
