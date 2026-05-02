import React from 'react';
import { useSelector } from 'react-redux';
import { TbCheck } from 'react-icons/tb';
import NoResult from '../../../../../components/NoResult';
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
import {
  groupDetailBenefitsByCarrier,
  groupPlatformBenefitsByCarrier,
} from '../../../utils/benefitGrouping';

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
  const user = useSelector((state: RootState) => state.auth.user);

  const isUserGrade = (grade: string, tierCarrier?: string | null) =>
    isGradeApplicableToProfile({
      benefitCarrier: tierCarrier ?? detailData?.data?.carrier,
      benefitGrade: grade,
      userCarrier: user?.carrier,
      userGrade: user?.membershipGradeCode ?? user?.membershipGrade,
    });

  const getGradeDisplayName = (grade: string) => getMembershipGradeLabel(grade);

  const platformBenefitGroups = groupPlatformBenefitsByCarrier(platform);
  const detailBenefitGroups = groupDetailBenefitsByCarrier(
    detailData?.data?.tierBenefits ?? [],
    detailData?.data?.carrier
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
        <div className="mb-6 max-xl:mb-4">
          <h3 className="text-title-6 text-grey06 mb-2 max-xl:text-title-7 max-xl:mb-1.5">
            상세 혜택
          </h3>
          <div className="space-y-2">
            <div className="h-24 animate-pulse rounded-2xl bg-grey01 max-md:rounded-xl" />
            <div className="h-20 animate-pulse rounded-2xl bg-grey01 max-md:rounded-xl" />
          </div>
        </div>
      )}

      {!shouldShowLoading && (
        <>
          {carrierOptions.length > 1 && (
            <div className="mb-4 flex flex-wrap gap-2 max-xl:mb-3">
              {carrierOptions.map((carrier) => (
                <button
                  key={carrier}
                  type="button"
                  onClick={() => onCarrierChange(carrier)}
                  className={`rounded-full border px-3 py-1.5 text-body-4 transition-colors max-md:px-2.5 max-md:py-1 ${
                    activeCarrier === carrier
                      ? 'border-purple04 bg-purple04 text-white'
                      : 'border-grey02 bg-white text-grey05 hover:border-purple02 hover:text-purple04'
                  }`}
                >
                  {getCarrierLabel(carrier)}
                </button>
              ))}
            </div>
          )}

          <div className={`${hasBenefits ? 'mb-6 max-xl:-mt-2 max-xl:mb-4' : ''}`}>
            <h3 className="text-title-6 text-grey06 mb-2 max-xl:text-title-7 max-xl:mb-1.5">
              상세 혜택
            </h3>

            {hasBenefits ? (
              <div className="space-y-3 max-xl:space-y-2">
                {visibleBenefitGroups.map((group) => (
                  <section
                    key={group.key}
                    className={`rounded-2xl border px-3.5 py-3 max-md:rounded-xl max-md:px-3 max-md:py-2.5 ${
                      activeCarrier === group.key
                        ? 'border-purple03 bg-purple01/70'
                        : 'border-grey02 bg-grey01/40'
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2 max-md:mb-1.5">
                      <span className="rounded-full bg-white px-2.5 py-1 text-body-4 font-bold text-purple04 shadow-sm max-md:text-body-5">
                        {group.label}
                      </span>
                      <span className="text-body-5 text-grey04">
                        {group.benefits.length}개 혜택
                      </span>
                    </div>

                    <div className="space-y-2 max-xl:space-y-1.5">
                      {group.benefits.map((benefit, index) => {
                        const isHighlighted = benefit.grades.some((grade) =>
                          isUserGrade(grade, benefit.carrier)
                        );

                        return (
                          <div
                            key={`${group.key}-${benefit.grades.join('-')}-${index}`}
                            className={`rounded-xl bg-white px-3 py-2.5 max-md:px-2.5 ${
                              isHighlighted ? 'ring-1 ring-orange04/40' : ''
                            }`}
                          >
                            <div className="mb-1.5 flex min-w-0 items-center gap-2">
                              <TbCheck
                                size={20}
                                className={`flex-shrink-0 max-md:w-4 max-md:h-4 ${
                                  isHighlighted ? 'text-orange04' : 'text-grey04'
                                }`}
                              />
                              <span
                                className={`min-w-0 rounded-full bg-grey01 px-2 py-0.5 text-body-3 leading-6 max-xl:text-body-4 ${
                                  isHighlighted
                                    ? 'text-orange04 font-bold'
                                    : 'text-grey05 font-medium'
                                }`}
                              >
                                {benefit.grades.map(getGradeDisplayName).join(', ')}
                              </span>
                            </div>
                            <p
                              className={`min-w-0 whitespace-pre-line break-words pl-7 text-body-3 leading-7 max-xl:text-body-4 max-md:pl-6 ${
                                isHighlighted ? 'text-orange04 font-bold' : 'text-grey05'
                              }`}
                            >
                              {benefit.context}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
                {visibleBenefitGroups.length === 0 && (
                  <div className="rounded-2xl border border-grey02 bg-grey01/40 px-4 py-6 text-center max-md:rounded-xl">
                    <p className="text-body-3 text-grey05 max-md:text-body-4">
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

            {/* 구분선 - 혜택이 있을 때만 표시 */}
            {hasBenefits && <div className="border-b border-grey03 w-full mt-4 max-xl:mt-3" />}
          </div>
        </>
      )}
    </>
  );
};

export default StoreDetailBenefits;
