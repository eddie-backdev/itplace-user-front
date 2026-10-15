'use client';

import benefitDisplay from '../content/benefit-display.json';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  CarrierCode,
  getCarrierLabel,
  getMembershipGradeOptions,
  getMembershipGradeLabel,
  isGradeApplicableToProfile,
} from '../utils/membership';
import { getPartnerBenefitPath } from '../utils/partnerSeo';
import { getLoginHref } from '../features/loginPage/utils/returnTo.mjs';
import MembershipSelectionDialog from '@/components/membership/MembershipSelectionDialog';
import styles from './PartnerBenefitPage.module.css';

const getUsageTypeLabel = (usageType: CarrierBenefitDetail['usageType']) => {
  if (usageType === 'ONLINE') return '온라인';
  if (usageType === 'OFFLINE') return '오프라인';
  return '온라인·오프라인';
};

const getManualExcerpt = (manual?: string | null) => {
  const text = manual?.trim() ?? '';
  if (text.length <= 180) return text;
  const firstSentence = text.match(/^(.+?[.!?。！？])(?=\s|$)/s)?.[1];
  if (firstSentence && firstSentence.length <= 220) return firstSentence;
  const boundary = text.lastIndexOf(' ', 180);
  return `${text.slice(0, boundary > 0 ? boundary : 180).trim()}…`;
};

const groupTierBenefitConditions = (
  tierBenefits: CarrierBenefitDetail['tierBenefits']
): Array<{ context: string; gradeLabels: string[] }> =>
  tierBenefits.reduce<Array<{ context: string; gradeLabels: string[] }>>((groups, tierBenefit) => {
    const context = tierBenefit.context?.trim();
    if (!context) return groups;

    const gradeLabel = tierBenefit.isAll ? '전체 등급' : getMembershipGradeLabel(tierBenefit.grade);
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
    membershipCarrier ?? initialDetail?.carrierGroups[0]?.carrier ?? null
  );
  const [selectedBenefitId, setSelectedBenefitId] = useState<number | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    initialDetail ? 'ready' : 'loading'
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
        const response = await getPartnerBenefitDetail(partnerId);
        if (requestId !== detailRequestIdRef.current) return;
        const canonicalPath = getPartnerBenefitPath(response.partnerId, response.partnerName);
        const requestedPath = `/benefits/partners/${partnerIdParam}/${partnerSlug}`;
        if (requestedPath !== canonicalPath) {
          navigate(`${canonicalPath}${window.location.search}${window.location.hash}`, {
            replace: true,
          });
        }
        setDetail(response);
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
        if (showLoading || !initialDetail || initialDetail.carrierGroups.length === 0) {
          setDetail(null);
          setStatus('error');
        }
      }
    },
    [initialDetail, navigate, partnerId, partnerIdParam, partnerSlug, membershipCarrier]
  );

  useEffect(() => {
    if (initialDetail && !isAuthRehydrated) return;
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
  const selectedGrade =
    (membershipCarrier === selectedGroup?.carrier ? membershipGrade : null) ??
    (selectedGroup
      ? (getMembershipGradeOptions(selectedGroup.carrier).find((option) =>
          selectedGroup.benefits.some((benefit) =>
            benefit.tierBenefits.some(
              (tier) =>
                tier.isAll ||
                isGradeApplicableToProfile({
                  benefitCarrier: selectedGroup.carrier,
                  benefitGrade: tier.grade,
                  userCarrier: selectedGroup.carrier,
                  userGrade: option.code,
                })
            )
          )
        )?.code ??
        getMembershipGradeOptions(selectedGroup.carrier)[0]?.code ??
        null)
      : null);
  const matchingBenefits = useMemo(
    () =>
      selectedGroup?.benefits.filter(
        (benefit) =>
          benefit.tierBenefits.length === 0 ||
          benefit.tierBenefits.some(
            (tier) =>
              tier.isAll ||
              isGradeApplicableToProfile({
                benefitCarrier: selectedGroup.carrier,
                benefitGrade: tier.grade,
                userCarrier: selectedGroup.carrier,
                userGrade: selectedGrade,
              })
          )
      ) ?? [],
    [selectedGrade, selectedGroup]
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
  const gradeOptions = selectedGroup ? getMembershipGradeOptions(selectedGroup.carrier) : [];
  const dialogCarrier =
    selectedCarrier ?? membershipCarrier ?? detail?.carrierGroups[0]?.carrier ?? 'SKT';
  const dialogGrade =
    (membershipCarrier === dialogCarrier ? membershipGrade : null) ??
    getMembershipGradeOptions(dialogCarrier)[0]?.code ??
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
    if (!isAuthRehydrated || pendingFavoriteId !== null) return;
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
        selectedBenefit.tierBenefits.filter(
          (tier) =>
            tier.isAll ||
            isGradeApplicableToProfile({
              benefitCarrier: selectedGroup?.carrier,
              benefitGrade: tier.grade,
              userCarrier: selectedGroup?.carrier,
              userGrade: selectedGrade,
            })
        )
      )
    : [];
  const [conditionHeadline = '', ...conditionNotes] =
    selectedConditions[0]?.context.split('※') ?? [];
  const selectedBenefitHeadline =
    conditionHeadline
      .trim()
      .replace(detail?.partnerName ?? '', '')
      .trim() || (selectedBenefit ? getCarrierBenefitDisplayName(selectedBenefit) : '');
  const selectedBenefitSupport =
    conditionNotes.join(' · ').trim() ||
    (selectedBenefit?.description !== selectedBenefitHeadline
      ? selectedBenefit?.description
      : null);
  const manualText = selectedBenefit?.manual ?? '';
  const manualExcerpt = getManualExcerpt(manualText);
  const sourceHref =
    selectedBenefit?.sourceUrl ||
    selectedBenefit?.url ||
    (selectedGroup ? benefitDisplay.carrierSources[selectedGroup.carrier].url : null);

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
                        detail.category,
                        getCarrierLabel(selectedGroup.carrier),
                        getMembershipGradeLabel(selectedGrade ?? ''),
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
                      const firstGrade = getMembershipGradeOptions(carrier)[0]?.code;
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
                <dl className={styles.conditionList}>
                  {selectedConditions.map((condition) => (
                    <div key={condition.context} className={styles.conditionRow}>
                      <dt>
                        적용 등급
                        <span>{condition.gradeLabels.join(' · ')}</span>
                      </dt>
                      <dd>{condition.context}</dd>
                    </div>
                  ))}
                  {selectedBenefit.benefitLimit ? (
                    <div className={styles.conditionRow}>
                      <dt>이용 한도</dt>
                      <dd>{selectedBenefit.benefitLimit}</dd>
                    </div>
                  ) : null}
                  <div className={styles.conditionRow}>
                    <dt>이용 방식</dt>
                    <dd>{getUsageTypeLabel(selectedBenefit.usageType)}</dd>
                  </div>
                </dl>
              </section>

              <section className={styles.contentSection} aria-labelledby="benefit-usage">
                <h2 id="benefit-usage">이용 방법</h2>
                <div className={styles.usagePanel}>
                  {manualExcerpt ? (
                    <p className={styles.manual}>{manualExcerpt}</p>
                  ) : selectedBenefit.description &&
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
                {sourceHref ? (
                  <a
                    className={styles.sourceLink}
                    href={sourceHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    안내 출처 보기 <TbExternalLink aria-hidden="true" />
                  </a>
                ) : null}
              </section>

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
                  <TbMapPin aria-hidden="true" />
                  매장 찾기
                </NearbyStoresButton>
              </section>
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
                {getMembershipGradeLabel(selectedGrade ?? '')}
                {selectedBenefit.benefitLimit ? ' · ' + selectedBenefit.benefitLimit : ''}
              </p>
              <div className={styles.summaryActions}>
                <button
                  type="button"
                  aria-pressed={selectedBenefit.isFavorite}
                  aria-label={
                    selectedBenefit.isFavorite ? '관심 혜택 해제' : '관심 혜택 추가'
                  }
                  disabled={
                    !isAuthRehydrated ||
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
