import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TbArrowLeft, TbExternalLink, TbMapPin, TbStar, TbStarFilled } from 'react-icons/tb';
import InfoPageShell from '../components/InfoPageShell';
import NoResult from '../components/NoResult';
import PageSeo from '../components/PageSeo';
import SafeImage from '../components/SafeImage';
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
      <InfoPageShell
        eyebrow="IT:PLACE PARTNER BENEFIT"
        title={`${partnerName} 멤버십 혜택`}
        description={pageDescription}
      >
        <Link
          to="/benefits"
          className="inline-flex items-center gap-2 font-bold text-purple05 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
        >
          <TbArrowLeft className="h-5 w-5" aria-hidden="true" />
          전체 혜택으로 돌아가기
        </Link>

        {status === 'loading' ? (
          <div className="space-y-4" aria-label="제휴처 혜택 로딩 중">
            <div className="h-28 animate-pulse rounded-3xl bg-grey01" />
            <div className="h-12 w-72 max-w-full animate-pulse rounded-2xl bg-grey01" />
            <div className="h-64 animate-pulse rounded-3xl bg-grey01" />
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-grey02">
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
            <section className="flex min-w-0 items-center gap-5 rounded-3xl border border-grey02 bg-white p-5 shadow-[0_12px_32px_rgba(16,17,20,0.05)] md:p-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-grey01 p-2.5 md:h-24 md:w-24">
                <SafeImage
                  src={detail.image}
                  alt={`${detail.partnerName} 로고`}
                  fallbackLabel={detail.partnerName}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-purple04">
                  {detail.category || '카테고리 미분류'}
                </p>
                <h2 className="mt-1 break-keep text-2xl font-black tracking-[-0.03em] text-grey07 md:text-3xl">
                  {detail.partnerName}
                </h2>
                <p className="mt-2 text-body-3 text-grey05">
                  {carrierNames.join(' · ')} 멤버십 혜택 제공
                </p>
              </div>
            </section>

            <section aria-labelledby="carrier-benefit-selector">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-purple04">통신사별 비교</p>
                  <h2
                    id="carrier-benefit-selector"
                    className="mt-1 text-2xl font-black tracking-[-0.03em] text-grey07"
                  >
                    내 통신사를 선택하세요
                  </h2>
                </div>
                {selectedGroup ? (
                  <Link
                    to={getCarrierMembershipPath(selectedGroup.carrier)}
                    className="text-body-3 font-bold text-purple05"
                  >
                    {getCarrierLabel(selectedGroup.carrier)} 멤버십 더 알아보기
                  </Link>
                ) : null}
              </div>
              <div
                className="mt-4 flex flex-wrap gap-2"
                role="tablist"
                aria-label="혜택 통신사 선택"
              >
                {detail.carrierGroups.map((group) => {
                  const isSelected = selectedCarrier === group.carrier;
                  return (
                    <button
                      key={group.carrier}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => setSelectedCarrier(group.carrier)}
                      className={`rounded-full border px-4 py-2.5 text-body-3 font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 ${
                        isSelected
                          ? 'border-purple04 bg-purple05 text-white shadow-[0_6px_16px_rgba(113,50,245,0.20)]'
                          : 'border-grey02 bg-white text-grey06 hover:border-purple02 hover:text-purple05'
                      }`}
                    >
                      {getCarrierLabel(group.carrier)}
                      <span className={`ml-2 ${isSelected ? 'text-white/75' : 'text-grey04'}`}>
                        {group.benefits.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-4" role="tabpanel">
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

                return (
                  <article
                    key={benefit.benefitId}
                    className="overflow-hidden rounded-3xl border border-grey02 bg-white p-5 shadow-[0_10px_28px_rgba(16,17,20,0.04)] md:p-6"
                  >
                    <header className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-purple01 px-3 py-1 text-xs font-bold text-purple05">
                            {getCarrierLabel(selectedGroup.carrier)}
                          </span>
                          <span className="rounded-full bg-grey01 px-3 py-1 text-xs font-bold text-grey05">
                            {getUsageTypeLabel(benefit.usageType)}
                          </span>
                        </div>
                        <h3 className="mt-3 break-keep text-xl font-black leading-snug text-grey07 md:text-2xl">
                          {benefit.benefitName}
                        </h3>
                      </div>
                      <button
                        type="button"
                        aria-label={benefit.isFavorite ? '관심 혜택에서 제거' : '관심 혜택에 추가'}
                        disabled={pendingFavoriteId === benefit.benefitId}
                        onClick={() => void toggleFavorite(benefit)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-accentRose transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 disabled:opacity-50"
                      >
                        {benefit.isFavorite ? (
                          <TbStarFilled className="h-5 w-5" />
                        ) : (
                          <TbStar className="h-5 w-5" />
                        )}
                      </button>
                    </header>

                    <div className="mt-5 grid gap-3">
                      {conditionGroups.length > 0 ? (
                        conditionGroups.map((conditionGroup) => (
                          <div
                            key={`${benefit.benefitId}-${conditionGroup.context}`}
                            className="rounded-2xl border border-purple01 bg-purple01/55 p-4"
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
                            <p className="mt-3 whitespace-pre-line break-words font-bold leading-7 text-grey07">
                              {conditionGroup.context}
                            </p>
                          </div>
                        ))
                      ) : benefit.description ? (
                        <div className="rounded-2xl border border-purple01 bg-purple01/55 p-4">
                          <p className="whitespace-pre-line break-words font-bold leading-7 text-grey07">
                            {benefit.description}
                          </p>
                        </div>
                      ) : null}

                      {benefit.benefitLimit ? (
                        <div className="rounded-2xl bg-grey01/70 p-4">
                          <p className="text-xs font-bold text-grey05">이용 제한</p>
                          <p className="mt-2 whitespace-pre-line break-words leading-6 text-grey06">
                            {benefit.benefitLimit}
                          </p>
                        </div>
                      ) : null}

                      {benefit.manual ? (
                        <details className="rounded-2xl border border-grey02 p-4">
                          <summary className="cursor-pointer font-bold text-grey06">
                            이용 방법 보기
                          </summary>
                          <p className="mt-3 whitespace-pre-line break-words leading-6 text-grey06">
                            {benefit.manual}
                          </p>
                        </details>
                      ) : null}

                      {benefit.url ? (
                        <a
                          href={benefit.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-grey02 px-5 font-bold text-grey06 transition hover:border-purple02 hover:text-purple05 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
                        >
                          통신사 공식 혜택 페이지
                          <TbExternalLink className="h-5 w-5" aria-hidden="true" />
                        </a>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="rounded-3xl bg-grey07 p-6 text-white md:p-7">
              <h2 className="text-xl font-black tracking-[-0.02em]">
                가까운 {detail.partnerName} 매장을 찾아보세요
              </h2>
              <p className="mt-3 leading-7 text-white/80">
                지도에서 현재 위치 주변 매장을 찾은 뒤 실제 매장 적용 여부와 최신 혜택 조건을
                확인하세요.
              </p>
              <Link
                to={`/?search=${encodeURIComponent(detail.partnerName)}`}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-bold text-grey07"
              >
                <TbMapPin className="h-5 w-5" aria-hidden="true" />
                지도에서 매장 찾기
              </Link>
            </section>
          </>
        ) : null}
      </InfoPageShell>
    </>
  );
};

export default PartnerBenefitPage;
