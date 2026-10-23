import React from 'react';
import { useSelector } from 'react-redux';
import { TbCheck } from 'react-icons/tb';
import NoResult from '../../../../../components/NoResult';
import BenefitConditions from '../../../../allBenefitsPage/components/BenefitConditions';
import { RootState } from '../../../../../store';
import { BenefitDetailResponse } from '../../../types/api';
import { Platform } from '../../../types';
import {
  CarrierCode,
  getCarrierLabel,
  getMembershipGradeLabel,
  isGradeApplicableToProfile,
  isCarrierCode,
} from '../../../../../utils/membership';
import { useReferenceData } from '../../../../../components/ReferenceDataProvider';
import {
  BENEFIT_USAGE_CHANNEL_LABELS,
  BENEFIT_USAGE_CHANNEL_ORDER,
  DisplayBenefit,
  groupDetailBenefitsByCarrier,
  groupPlatformBenefitsByCarrier,
} from '../../../utils/benefitGrouping';

const groupBenefitsByUsageChannel = (benefits: DisplayBenefit[]) =>
  BENEFIT_USAGE_CHANNEL_ORDER.map((channel) => ({
    channel,
    label: BENEFIT_USAGE_CHANNEL_LABELS[channel],
    benefits: benefits.filter((benefit) => benefit.channel === channel),
  })).filter((section) => section.benefits.length > 0);

interface StoreDetailBenefitsProps {
  platform: Platform;
  activeCarrier: CarrierCode | null;
  onCarrierChange: (carrier: CarrierCode) => void;
  detailData: BenefitDetailResponse | null;
  isLoading?: boolean;
}

const StoreDetailBenefits: React.FC<StoreDetailBenefitsProps> = ({
  platform,
  activeCarrier,
  onCarrierChange,
  detailData,
  isLoading = false,
}) => {
  const { data: referenceData } = useReferenceData();
  const user = useSelector((state: RootState) => state.auth.user);

  const isUserGrade = (grade: string, tierCarrier?: string | null) =>
    isGradeApplicableToProfile({
      benefitCarrier: tierCarrier ?? detailData?.data?.carrier,
      benefitGrade: grade,
      userCarrier: user?.carrier,
      userGrade: user?.membershipGradeCode ?? user?.membershipGrade,
      referenceData,
    });

  const getGradeDisplayName = (grade: string) => getMembershipGradeLabel(grade, referenceData);

  const platformBenefitGroups = groupPlatformBenefitsByCarrier(platform, referenceData);
  const detailBenefitGroups = groupDetailBenefitsByCarrier(
    detailData?.data?.tierBenefits ?? [],
    detailData?.data?.carrier,
    referenceData
  );
  // 지도 검색 결과에 이미 통신사별 혜택이 들어있으면 상세 탭은 API 재조회 없이
  // 그 데이터를 보기 좋게 필터링해서 보여준다. 상세 API는 이미지/URL/이용방법/액션 ID 보강용이다.
  const benefitGroups =
    platformBenefitGroups.length > 0 ? platformBenefitGroups : detailBenefitGroups;
  const carrierOptions = benefitGroups.map((group) => group.key).filter(isCarrierCode);
  const visibleBenefitGroups =
    activeCarrier && carrierOptions.length > 1
      ? benefitGroups.filter((group) => group.key === activeCarrier)
      : benefitGroups;
  const shouldShowLoading = isLoading && benefitGroups.length === 0;
  const hasBenefits = benefitGroups.length > 0;

  return (
    <>
      {shouldShowLoading && (
        <div className="mb-5">
          <h3 className="mb-2 text-sm font-semibold text-[#202124]">상세 혜택</h3>
          <div className="space-y-2">
            <div className="h-24 animate-pulse rounded-xl bg-[#f6f6f4]" />
            <div className="h-20 animate-pulse rounded-xl bg-[#f6f6f4]" />
          </div>
        </div>
      )}

      {!shouldShowLoading && (
        <>
          {carrierOptions.length > 1 && (
            <div className="mb-4 flex flex-wrap gap-2 border-b border-[#E8E9EE] pb-3">
              {carrierOptions.map((carrier) => (
                <button
                  key={carrier}
                  type="button"
                  onClick={() => onCarrierChange(carrier)}
                  aria-pressed={activeCarrier === carrier}
                  className={`inline-flex min-h-11 items-center rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154D9] ${
                    activeCarrier === carrier
                      ? 'border-[#6154D9] bg-white text-[#6154D9]'
                      : 'border-[#E8E9EE] bg-white text-[#686B73] hover:bg-[#F7F8FA] hover:text-[#202124]'
                  }`}
                >
                  {getCarrierLabel(carrier)}
                </button>
              ))}
            </div>
          )}

          <div className={`${hasBenefits ? 'mb-5' : ''}`}>
            <h3 className="mb-2 text-sm font-semibold text-[#202124]">상세 혜택</h3>

            {hasBenefits ? (
              <div className="divide-y divide-[#E8E9EE]">
                {visibleBenefitGroups.map((group) => (
                  <section key={group.key} className="min-w-0 py-3 first:pt-1 last:pb-1">
                    <div className="mb-2 flex items-center gap-2 max-md:mb-1.5">
                      <span className="text-sm font-semibold text-[#202124]">{group.label}</span>
                      <span className="text-xs text-[#686B73]">{group.benefits.length}개 혜택</span>
                    </div>

                    <div className="space-y-3">
                      {groupBenefitsByUsageChannel(group.benefits).map((section) => (
                        <div
                          key={`${group.key}-${section.channel}`}
                          className="min-w-0 space-y-1.5"
                        >
                          <div className="flex min-h-7 items-center">
                            <span className="text-xs font-medium text-[#686B73]">
                              {section.label}
                            </span>
                          </div>
                          {section.benefits.map((benefit, index) => {
                            const isHighlighted = benefit.grades.some((grade) =>
                              isUserGrade(grade, benefit.carrier)
                            );

                            return (
                              <div
                                key={`${group.key}-${benefit.channel}-${benefit.grades.join('-')}-${index}`}
                                className="min-w-0 py-2"
                              >
                                <div className="mb-1.5 flex min-w-0 items-center gap-2">
                                  <TbCheck
                                    size={20}
                                    className={`shrink-0 ${
                                      isHighlighted ? 'text-[#6154D9]' : 'text-[#686B73]'
                                    }`}
                                    aria-hidden="true"
                                  />
                                  <span
                                    className={`min-w-0 break-words text-sm leading-5 ${
                                      isHighlighted
                                        ? 'font-semibold text-[#6154D9]'
                                        : 'font-medium text-[#202124]'
                                    }`}
                                  >
                                    {benefit.grades.map(getGradeDisplayName).join(', ')}
                                  </span>
                                </div>
                                <p
                                  className={`min-w-0 whitespace-pre-line break-words pl-7 text-sm leading-6 max-md:pl-7 ${
                                    isHighlighted ? 'font-medium text-[#202124]' : 'text-[#686B73]'
                                  }`}
                                >
                                  {benefit.context}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
                {visibleBenefitGroups.length === 0 && (
                  <div className="px-2 py-5 text-center">
                    <p className="text-sm text-[#686B73]">
                      선택한 통신사에서 제공하는 혜택이 없어요.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-2">
                <NoResult
                  message1="혜택 정보가 없어요!"
                  message2="지도에서 확인할 수 있는 통신사 혜택이 존재하지 않아요"
                  message1FontSize="text-title-6"
                  message2FontSize="text-body-3"
                  isLoginRequired={false}
                />
              </div>
            )}

            {detailData?.data &&
            (!detailData.data.carrier || detailData.data.carrier === activeCarrier) ? (
              <BenefitConditions
                conditions={detailData.data.conditions}
                sourceUrl={detailData.data.sourceUrl}
                sourceCapturedAt={detailData.data.sourceCapturedAt}
                manual={detailData.data.manual}
                usageType={detailData.data.usageType}
                includeTierDetails={false}
                className="mt-4"
              />
            ) : null}

            {/* 구분선 - 혜택이 있을 때만 표시 */}
            {hasBenefits && <div className="mt-4 w-full border-b border-[#E8E9EE]" />}
          </div>
        </>
      )}
    </>
  );
};

export default StoreDetailBenefits;
