import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from '@/lib/navigation';
import { TbExternalLink, TbMapPin, TbStar, TbStarFilled } from 'react-icons/tb';
import Modal from '../../../components/DetailModal';
import NoResult from '../../../components/NoResult';
import SafeImage from '../../../components/SafeImage';
import BenefitConditions from './BenefitConditions';
import { RootState } from '../../../store';
import { showToast } from '../../../utils/toast';
import {
  CarrierBenefitDetail,
  PartnerBenefitDetailResponse,
  PartnerBenefitItem,
  addFavorite,
  getCarrierBenefitDisplayName,
  getMembershipOptionLabel,
  getSourceOptionLabel,
  getPartnerBenefitDetail,
  removeFavorite,
} from '../apis/allBenefitsApi';
import {
  CarrierCode,
  getCarrierGradeOrder,
  getCarrierLabel,
  getMembershipGradeLabel,
  isCarrierCode,
} from '../../../utils/membership';
import { useReferenceData } from '../../../components/ReferenceDataProvider';
import { getCategoryLabel } from '../../../utils/referenceData';
import { hasKnownStores } from '../apis/benefitChannelFacts.mjs';
import { getApplicableTierBenefits, hasStructuredOffers } from '../apis/partnerBenefitModel';

interface BenefitDetailModalProps {
  isOpen: boolean;
  partner: PartnerBenefitItem | null;
  onClose: () => void;
}

const groupTierBenefitConditions = (
  tierBenefits: CarrierBenefitDetail['tierBenefits'],
  referenceData?: import('../../../utils/referenceData').ReferenceData | null
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

const BenefitDetailModal = ({ isOpen, partner, onClose }: BenefitDetailModalProps) => {
  const { data: referenceData } = useReferenceData();
  const navigate = useNavigate();
  const preferredCarrier = useSelector((state: RootState) => state.auth.user?.carrier);
  const preferredGrade = useSelector(
    (state: RootState) =>
      state.auth.user?.membershipGradeCode ?? state.auth.user?.membershipGrade ?? null
  );
  const [detail, setDetail] = useState<PartnerBenefitDetailResponse | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [pendingFavoriteId, setPendingFavoriteId] = useState<number | null>(null);

  const loadPartnerDetail = useCallback(async () => {
    if (!partner) return;

    setIsLoading(true);
    setLoadError(false);
    try {
      const response = await getPartnerBenefitDetail(partner.partnerId);
      setDetail(response);
    } catch {
      setLoadError(true);
      showToast('제휴처 혜택을 불러오는 중 오류가 발생했습니다', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [partner]);

  useEffect(() => {
    if (!isOpen || !partner) return;
    setDetail(null);
    setSelectedCarrier(null);
    void loadPartnerDetail();
  }, [isOpen, loadPartnerDetail, partner]);

  useEffect(() => {
    if (!detail?.carrierGroups.length) return;
    setSelectedCarrier((currentCarrier) => {
      if (
        currentCarrier &&
        detail.carrierGroups.some((group) => group.carrier === currentCarrier)
      ) {
        return currentCarrier;
      }
      if (
        isCarrierCode(preferredCarrier) &&
        detail.carrierGroups.some((group) => group.carrier === preferredCarrier)
      ) {
        return preferredCarrier;
      }
      return detail.carrierGroups[0].carrier;
    });
  }, [detail, preferredCarrier]);

  const selectedGroup = useMemo(
    () => detail?.carrierGroups.find((group) => group.carrier === selectedCarrier) ?? null,
    [detail, selectedCarrier]
  );
  const selectedGrade = selectedGroup?.carrier === preferredCarrier ? preferredGrade : null;

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

  if (!partner) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="제휴처 혜택">
      <div className="relative flex h-full flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto p-4 max-md:p-3">
          {isLoading ? (
            <div className="flex h-[280px] items-center justify-center text-body-3 text-grey04">
              통신사별 혜택을 불러오는 중...
            </div>
          ) : loadError ? (
            <div className="flex h-[280px] items-center justify-center">
              <NoResult
                variant="error"
                message1="제휴처 혜택을 불러오지 못했어요"
                message2="잠시 후 다시 시도해 주세요."
                buttonText="다시 시도"
                onButtonClick={loadPartnerDetail}
                message1FontSize="text-title-7"
                message2FontSize="text-body-4"
              />
            </div>
          ) : detail ? (
            <>
              <section className="flex min-w-0 items-center gap-4 rounded-[14px] bg-grey01/70 p-4 max-md:gap-3 max-md:p-3">
                <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-grey02 bg-white p-2 max-md:h-16 max-md:w-16">
                  <SafeImage
                    src={detail.image}
                    alt={`${detail.partnerName} 로고`}
                    fallbackLabel={detail.partnerName}
                    className="h-full w-full object-contain"
                    fallbackClassName="text-title-8"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <h4 className="line-clamp-2 text-title-5 font-bold leading-snug text-grey07 max-md:text-title-7">
                    {detail.partnerName}
                  </h4>
                  <p className="mt-1 text-body-4 font-medium text-grey05">
                    {getCategoryLabel(detail.category, referenceData) || '카테고리 미분류'}
                  </p>
                </div>
              </section>

              <section className="mt-3" aria-label="통신사별 혜택 선택">
                {detail.carrierGroups.length === 1 ? (
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-body-4 font-bold text-grey06">지원 통신사</p>
                      <div
                        className="mt-2 inline-flex min-h-8 items-center gap-2 rounded-full border border-purple01 bg-purple01/60 px-3"
                        aria-label={`${getCarrierLabel(detail.carrierGroups[0].carrier)} 지원 혜택`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-purple04" aria-hidden="true" />
                        <span className="text-body-4 font-bold text-purple05">
                          {getCarrierLabel(detail.carrierGroups[0].carrier)}
                        </span>
                      </div>
                    </div>
                    <p className="pb-1 text-body-4 font-medium text-grey04">
                      혜택 {detail.carrierGroups[0].benefits.length}개
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-body-4 font-bold text-grey06">지원 통신사</p>
                      {selectedGroup ? (
                        <p className="text-body-4 font-medium text-grey04">
                          혜택 {selectedGroup.benefits.length}개
                        </p>
                      ) : null}
                    </div>
                    <div
                      className="mt-2 flex flex-wrap items-center gap-2"
                      role="tablist"
                      aria-label="혜택 통신사"
                    >
                      {detail.carrierGroups.map((group) => {
                        const isSelected = group.carrier === selectedCarrier;
                        return (
                          <button
                            key={group.carrier}
                            type="button"
                            role="tab"
                            aria-selected={isSelected}
                            onClick={() => setSelectedCarrier(group.carrier)}
                            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-body-4 font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 ${
                              isSelected
                                ? 'border-purple02 bg-purple01/70 text-purple05'
                                : 'border-grey02 bg-white text-grey05 hover:border-purple02 hover:text-purple05'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isSelected ? 'bg-purple04' : 'bg-grey03'
                              }`}
                              aria-hidden="true"
                            />
                            {getCarrierLabel(group.carrier)}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </section>

              <section className="mt-3 space-y-3" role="tabpanel">
                {selectedGroup?.benefits.map((benefit) => {
                  const applicableTierBenefits = getApplicableTierBenefits(
                    benefit.tierBenefits,
                    selectedGroup.carrier,
                    selectedGrade
                  );
                  const orderedGrades = getCarrierGradeOrder(
                    selectedGroup.carrier,
                    applicableTierBenefits.map((tierBenefit) => tierBenefit.grade),
                    referenceData
                  );
                  const orderedTierBenefits = orderedGrades
                    .map((grade) =>
                      applicableTierBenefits.find((tierBenefit) => tierBenefit.grade === grade)
                    )
                    .filter((tierBenefit) => tierBenefit !== undefined);
                  const conditionGroups = groupTierBenefitConditions(
                    orderedTierBenefits,
                    referenceData
                  );

                  return (
                    <article
                      key={benefit.benefitId}
                      className="overflow-hidden rounded-[14px] border border-grey02 bg-white p-4 shadow-[0_6px_18px_rgba(16,17,20,0.035)] max-md:p-3"
                    >
                      <header className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h5 className="break-keep text-title-7 font-bold leading-snug text-grey07 max-md:text-title-8">
                            {getCarrierBenefitDisplayName(benefit)}
                          </h5>
                          {getMembershipOptionLabel(benefit) && (
                            <span className="mt-1.5 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold leading-none text-blue-700">
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
                            benefit.isFavorite ? '관심 혜택에서 제거' : '관심 혜택에 추가'
                          }
                          disabled={pendingFavoriteId === benefit.benefitId}
                          onClick={() => void toggleFavorite(benefit)}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-accentRose transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 disabled:opacity-50"
                        >
                          {benefit.isFavorite ? (
                            <TbStarFilled className="h-5 w-5" />
                          ) : (
                            <TbStar className="h-5 w-5" />
                          )}
                        </button>
                      </header>

                      <div className="mt-3 border-t border-grey01 pt-3">
                        <BenefitConditions
                          conditions={benefit.conditions}
                          legacyLimit={benefit.benefitLimit}
                          sourceUrl={benefit.sourceUrl}
                          sourceCapturedAt={benefit.sourceCapturedAt}
                          manual={benefit.manual}
                          usageType={benefit.usageType}
                          carrier={selectedGroup.carrier}
                          grade={selectedGrade}
                          tierConditions={
                            conditionGroups.length > 0
                              ? conditionGroups.map((group) => ({
                                  grades: group.gradeLabels,
                                  context: group.context,
                                }))
                              : !hasStructuredOffers(benefit.conditions) && benefit.description
                                ? [{ grades: [], context: benefit.description }]
                                : []
                          }
                        />

                        {benefit.url ? (
                          <button
                            type="button"
                            onClick={() =>
                              window.open(benefit.url ?? undefined, '_blank', 'noopener,noreferrer')
                            }
                            className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-[12px] border border-grey02 text-body-4 font-bold text-grey06 transition-colors hover:border-purple02 hover:text-purple05 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
                          >
                            통신사 혜택 페이지
                            <TbExternalLink className="h-4 w-4" aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </section>
            </>
          ) : null}
        </div>

        {hasKnownStores(detail?.hasStores) ? (
          <div className="shrink-0 border-t border-grey01 bg-white px-4 py-3 max-md:px-3">
            <button
              type="button"
              onClick={() => {
                navigate(`/map?search=${encodeURIComponent(partner.partnerName)}`);
                showToast(`${partner.partnerName} 매장을 검색합니다`, 'info');
                onClose();
              }}
              className="mx-auto flex h-11 w-full max-w-[240px] items-center justify-center gap-1.5 rounded-[12px] bg-purple04 text-body-3 font-bold text-white max-md:text-body-4"
            >
              <TbMapPin className="h-4 w-4" aria-hidden="true" />
              지도에서 매장 찾기
            </button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
};

export default BenefitDetailModal;
