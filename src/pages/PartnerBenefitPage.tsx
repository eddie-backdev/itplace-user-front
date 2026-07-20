import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  TbArrowLeft,
  TbChevronDown,
  TbExternalLink,
  TbMapPin,
  TbStar,
  TbStarFilled,
} from 'react-icons/tb';
import NoResult from '../components/NoResult';
import PageSeo from '../components/PageSeo';
import SafeImage from '../components/SafeImage';
import SiteFooter from '../components/SiteFooter';
import { showToast } from '../utils/toast';
import {
  addFavorite,
  CarrierBenefitDetail,
  getPartnerBenefitDetail,
  PartnerBenefitDetailResponse,
  removeFavorite,
} from '../features/allBenefitsPage/apis/allBenefitsApi';
import {
  CarrierCode,
  getCarrierGradeOrder,
  getCarrierLabel,
  getMembershipGradeLabel,
} from '../utils/membership';
import {
  createPartnerSlug,
  getCarrierMembershipPath,
  getPartnerBenefitPath,
} from '../utils/partnerSeo';

const getUsageTypeLabel = (usageType: CarrierBenefitDetail['usageType']) => {
  if (usageType === 'ONLINE') return '온라인';
  if (usageType === 'OFFLINE') return '오프라인';
  return '온라인 · 오프라인';
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

const PartnerBenefitPage = () => {
  const { partnerId: partnerIdParam, partnerSlug = '' } = useParams<{
    partnerId: string;
    partnerSlug: string;
  }>();
  const navigate = useNavigate();
  const partnerId = Number(partnerIdParam);
  const [detail, setDetail] = useState<PartnerBenefitDetailResponse | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierCode | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [pendingFavoriteId, setPendingFavoriteId] = useState<number | null>(null);

  const loadDetail = useCallback(async () => {
    if (!Number.isInteger(partnerId) || partnerId <= 0) {
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      const response = await getPartnerBenefitDetail(partnerId);
      setDetail(response);
      setSelectedCarrier((currentCarrier) => {
        if (
          currentCarrier &&
          response.carrierGroups.some((group) => group.carrier === currentCarrier)
        ) {
          return currentCarrier;
        }
        return response.carrierGroups[0]?.carrier ?? null;
      });
      setStatus('ready');
    } catch {
      setDetail(null);
      setStatus('error');
    }
  }, [partnerId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (!detail) return;
    const canonicalPath = getPartnerBenefitPath(detail.partnerId, detail.partnerName);
    if (partnerSlug !== createPartnerSlug(detail.partnerName)) {
      navigate(canonicalPath, { replace: true });
    }
  }, [detail, navigate, partnerSlug]);

  const selectedGroup = useMemo(
    () => detail?.carrierGroups.find((group) => group.carrier === selectedCarrier) ?? null,
    [detail, selectedCarrier]
  );

  const fallbackPartnerName = partnerSlug.replace(/-/g, ' ').trim() || '제휴처';
  const partnerName = detail?.partnerName ?? fallbackPartnerName;
  const canonicalPath = detail
    ? getPartnerBenefitPath(detail.partnerId, detail.partnerName)
    : `/benefits/partners/${partnerIdParam}/${partnerSlug}`;
  const carrierNames = detail?.carrierGroups.map((group) => getCarrierLabel(group.carrier)) ?? [];
  const totalBenefitCount =
    detail?.carrierGroups.reduce((count, group) => count + group.benefits.length, 0) ?? 0;
  const pageDescription = detail
    ? `${detail.partnerName}에서 이용할 수 있는 ${carrierNames.join(', ')} 멤버십 혜택의 등급별 조건, 이용 방법과 제한 사항을 비교하세요.`
    : `${partnerName} 통신사 멤버십 혜택의 이용 조건과 통신사별 차이를 확인하세요.`;

  const structuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `${partnerName} 통신사 멤버십 혜택`,
      description: pageDescription,
      url: `https://itplace.click${canonicalPath}`,
      isPartOf: { '@id': 'https://itplace.click/#website' },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: '홈',
            item: 'https://itplace.click/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: '전체 멤버십 혜택',
            item: 'https://itplace.click/benefits',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: partnerName,
            item: `https://itplace.click${canonicalPath}`,
          },
        ],
      },
    }),
    [canonicalPath, pageDescription, partnerName]
  );

  const toggleFavorite = async (benefit: CarrierBenefitDetail) => {
    if (pendingFavoriteId !== null) return;
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
      <PageSeo
        title={`${partnerName} 통신사 멤버십 혜택 | 잇플레이스`}
        description={pageDescription}
        path={canonicalPath}
        image={detail?.image ?? undefined}
        noIndex={!Number.isInteger(partnerId) || partnerId <= 0}
        structuredData={structuredData}
      />
      <div className="flex min-h-screen flex-col bg-purple01/35 text-grey07">
        <main className="flex-1 px-4 py-5 md:px-8 md:py-7">
          <div className="mx-auto max-w-7xl">
            <Link
              to="/benefits"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl px-1 font-bold text-grey06 transition hover:text-purple05 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
            >
              <TbArrowLeft className="h-5 w-5" aria-hidden="true" />
              전체 혜택
            </Link>

            {status === 'loading' ? (
              <div className="mt-3 space-y-4" aria-label="제휴처 혜택 로딩 중">
                <div className="h-36 animate-pulse rounded-[28px] bg-white" />
                <div className="h-16 animate-pulse rounded-2xl bg-white" />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="h-72 animate-pulse rounded-3xl bg-white" />
                  <div className="h-72 animate-pulse rounded-3xl bg-white" />
                </div>
              </div>
            ) : null}

            {status === 'error' ? (
              <div className="mt-3 flex min-h-[480px] items-center justify-center rounded-[28px] border border-grey02 bg-white">
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

            {status === 'ready' && detail ? (
              <>
                <section className="relative mt-3 overflow-hidden rounded-[28px] border border-purple02 bg-white px-5 py-5 shadow-[0_16px_44px_rgba(113,50,245,0.09)] md:px-7 md:py-6">
                  <div
                    className="absolute -right-12 -top-20 h-52 w-52 rounded-full bg-purple01/70"
                    aria-hidden="true"
                  />
                  <div className="relative flex min-w-0 items-center gap-4 md:gap-5">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-grey01 bg-white p-2.5 shadow-[0_8px_24px_rgba(16,17,20,0.06)] md:h-24 md:w-24">
                      <SafeImage
                        src={detail.image}
                        alt={`${detail.partnerName} 로고`}
                        fallbackLabel={detail.partnerName}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex rounded-full bg-purple01 px-2.5 py-1 text-xs font-bold text-purple05">
                        {detail.category || '카테고리 미분류'}
                      </span>
                      <h1 className="mt-2 break-keep text-2xl font-black tracking-[-0.04em] text-grey07 md:text-4xl">
                        {detail.partnerName} 멤버십 혜택
                      </h1>
                      <p className="mt-2 break-keep text-sm font-medium text-grey05 md:text-base">
                        {carrierNames.join(' · ')}에서 제공하는 혜택 {totalBenefitCount}개
                      </p>
                    </div>
                  </div>
                </section>

                <section
                  className="sticky top-3 z-20 mt-4 rounded-2xl border border-grey02 bg-white/95 px-4 py-3 shadow-[0_10px_30px_rgba(16,17,20,0.07)] backdrop-blur md:px-5"
                  aria-labelledby="carrier-benefit-selector"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                      <h2
                        id="carrier-benefit-selector"
                        className="shrink-0 text-sm font-black text-grey07"
                      >
                        통신사 선택
                      </h2>
                      {detail.carrierGroups.length === 1 ? (
                        <span
                          id={`carrier-label-${detail.carrierGroups[0].carrier}`}
                          className="inline-flex min-h-10 items-center rounded-full bg-purple05 px-4 text-sm font-bold text-white"
                        >
                          {getCarrierLabel(detail.carrierGroups[0].carrier)}
                          <span className="ml-2 text-white/75">
                            {detail.carrierGroups[0].benefits.length}
                          </span>
                        </span>
                      ) : (
                        <div
                          className="flex flex-wrap gap-2"
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
                                onClick={() => setSelectedCarrier(group.carrier)}
                                className={`min-h-10 rounded-full border px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 ${
                                  isSelected
                                    ? 'border-purple04 bg-purple05 text-white shadow-[0_5px_14px_rgba(113,50,245,0.18)]'
                                    : 'border-grey02 bg-white text-grey06 hover:border-purple02 hover:text-purple05'
                                }`}
                              >
                                {getCarrierLabel(group.carrier)}
                                <span
                                  className={`ml-2 ${isSelected ? 'text-white/75' : 'text-grey04'}`}
                                >
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
                        className="hidden min-h-10 items-center gap-1 rounded-xl px-2 text-sm font-bold text-purple05 transition hover:bg-purple01 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 sm:inline-flex"
                      >
                        {getCarrierLabel(selectedGroup.carrier)} 멤버십 안내
                        <TbExternalLink className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    ) : null}
                  </div>
                </section>

                <section
                  id="selected-carrier-benefits"
                  className="mt-5"
                  role={detail.carrierGroups.length > 1 ? 'tabpanel' : 'region'}
                  aria-labelledby={
                    selectedGroup
                      ? `${detail.carrierGroups.length > 1 ? 'carrier-tab' : 'carrier-label'}-${selectedGroup.carrier}`
                      : undefined
                  }
                >
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-purple04">선택한 멤버십</p>
                      <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-grey07 md:text-2xl">
                        {selectedGroup ? getCarrierLabel(selectedGroup.carrier) : ''} 핵심 혜택
                      </h2>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-grey04">
                      총 {selectedGroup?.benefits.length ?? 0}개
                    </span>
                  </div>

                  <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="grid items-stretch gap-4 md:grid-cols-2">
                      {selectedGroup?.benefits.map((benefit) => {
                        const orderedGrades = getCarrierGradeOrder(
                          selectedGroup.carrier,
                          benefit.tierBenefits.map((tierBenefit) => tierBenefit.grade)
                        );
                        const orderedTierBenefits = orderedGrades
                          .map((grade) =>
                            benefit.tierBenefits.find((tierBenefit) => tierBenefit.grade === grade)
                          )
                          .filter((tierBenefit) => tierBenefit !== undefined);
                        const conditionGroups = groupTierBenefitConditions(orderedTierBenefits);
                        const normalizedDescription = benefit.description?.trim() ?? '';
                        const hasDistinctDescription =
                          normalizedDescription.length > 0 &&
                          !conditionGroups.some((group) => group.context === normalizedDescription);
                        const hasUsageDetails = hasDistinctDescription || Boolean(benefit.manual);

                        return (
                          <article
                            key={benefit.benefitId}
                            id={`benefit-${benefit.benefitId}`}
                            className={`flex h-full flex-col overflow-hidden rounded-3xl border border-grey02 bg-white p-5 shadow-[0_10px_28px_rgba(16,17,20,0.04)] ${
                              selectedGroup.benefits.length === 1 ? 'md:col-span-2' : ''
                            }`}
                          >
                            <header className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-grey01 px-3 py-1 text-xs font-bold text-grey05">
                                    {getUsageTypeLabel(benefit.usageType)}
                                  </span>
                                </div>
                                <h3 className="mt-2 break-keep text-xl font-black leading-snug text-grey07">
                                  {benefit.benefitName}
                                </h3>
                              </div>
                              <button
                                type="button"
                                aria-label={
                                  benefit.isFavorite ? '관심 혜택에서 제거' : '관심 혜택에 추가'
                                }
                                disabled={pendingFavoriteId === benefit.benefitId}
                                onClick={() => void toggleFavorite(benefit)}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-accentRose transition hover:bg-purple01 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 disabled:opacity-50"
                              >
                                {benefit.isFavorite ? (
                                  <TbStarFilled className="h-5 w-5" />
                                ) : (
                                  <TbStar className="h-5 w-5" />
                                )}
                              </button>
                            </header>

                            <div className="mt-4 flex flex-1 flex-col gap-3">
                              {conditionGroups.length > 0 ? (
                                <div className="divide-y divide-purple02/60 rounded-2xl bg-purple01/60 px-4">
                                  {conditionGroups.map((conditionGroup) => (
                                    <div
                                      key={`${benefit.benefitId}-${conditionGroup.context}`}
                                      className="py-3.5"
                                    >
                                      <div className="flex flex-wrap gap-1.5">
                                        {conditionGroup.gradeLabels.map((gradeLabel) => (
                                          <span
                                            key={gradeLabel}
                                            className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-purple05"
                                          >
                                            {gradeLabel}
                                          </span>
                                        ))}
                                      </div>
                                      <p className="mt-2.5 whitespace-pre-line break-words font-black leading-6 text-grey07">
                                        {conditionGroup.context}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : benefit.description ? (
                                <div className="rounded-2xl bg-purple01/60 p-4">
                                  <p className="whitespace-pre-line break-words font-black leading-6 text-grey07">
                                    {benefit.description}
                                  </p>
                                </div>
                              ) : null}

                              {benefit.benefitLimit ? (
                                <div className="flex items-start justify-between gap-4 rounded-xl bg-grey01/70 px-4 py-3">
                                  <p className="shrink-0 text-sm font-bold text-grey05">
                                    이용 제한
                                  </p>
                                  <p className="whitespace-pre-line break-words text-right text-sm font-bold leading-5 text-grey06">
                                    {benefit.benefitLimit}
                                  </p>
                                </div>
                              ) : null}

                              {hasUsageDetails ? (
                                <details className="group rounded-xl border border-grey02 px-4 py-3">
                                  <summary className="flex min-h-6 cursor-pointer list-none items-center justify-between gap-3 font-bold text-grey06 marker:content-none">
                                    이용 조건·방법
                                    <TbChevronDown
                                      className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180"
                                      aria-hidden="true"
                                    />
                                  </summary>
                                  <div className="mt-3 border-t border-grey02 pt-3 text-sm leading-6 text-grey06">
                                    {hasDistinctDescription ? (
                                      <p className="whitespace-pre-line break-words font-bold text-grey07">
                                        {benefit.description}
                                      </p>
                                    ) : null}
                                    {benefit.manual ? (
                                      <p
                                        className={`whitespace-pre-line break-words ${
                                          hasDistinctDescription ? 'mt-3' : ''
                                        }`}
                                      >
                                        {benefit.manual}
                                      </p>
                                    ) : null}
                                  </div>
                                </details>
                              ) : null}

                              {benefit.url ? (
                                <a
                                  href={benefit.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-grey02 px-4 text-sm font-bold text-grey06 transition hover:border-purple02 hover:text-purple05 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
                                >
                                  공식 혜택 확인
                                  <TbExternalLink className="h-5 w-5" aria-hidden="true" />
                                </a>
                              ) : null}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                    <aside
                      className="lg:sticky lg:top-24 lg:self-start"
                      aria-label="혜택 관련 바로가기"
                    >
                      <section className="flex flex-col rounded-3xl bg-purple05 p-5 text-white shadow-[0_14px_32px_rgba(113,50,245,0.18)]">
                        <p className="text-xs font-bold text-white/70">내 주변에서 사용하기</p>
                        <h2 className="mt-2 break-keep text-xl font-black leading-snug">
                          가까운 {detail.partnerName} 매장 찾기
                        </h2>
                        <p className="mt-2 break-keep text-sm leading-6 text-white/75">
                          실제 매장 적용 여부는 방문 전에 확인해 주세요.
                        </p>
                        <Link
                          to={`/?search=${encodeURIComponent(detail.partnerName)}`}
                          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-purple05 transition hover:bg-purple01 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                          <TbMapPin className="h-5 w-5" aria-hidden="true" />
                          지도에서 매장 찾기
                        </Link>

                        <div className="mt-5 border-t border-white/20 pt-4">
                          {selectedGroup ? (
                            <Link
                              to={getCarrierMembershipPath(selectedGroup.carrier)}
                              className="flex min-h-10 items-center justify-between gap-3 rounded-xl bg-white/10 px-3 text-sm font-bold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            >
                              <span className="break-keep">
                                {getCarrierLabel(selectedGroup.carrier)} 멤버십 안내
                              </span>
                              <TbExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                            </Link>
                          ) : null}
                          <p className="mt-3 break-keep text-xs leading-5 text-white/65">
                            혜택은 변경될 수 있으니 결제 전 최신 조건을 확인해 주세요.
                          </p>
                        </div>
                      </section>
                    </aside>
                  </div>
                </section>
              </>
            ) : null}
          </div>
        </main>
        <SiteFooter />
      </div>
    </>
  );
};

export default PartnerBenefitPage;
