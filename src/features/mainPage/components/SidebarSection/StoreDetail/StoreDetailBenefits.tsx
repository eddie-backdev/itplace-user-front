import React from 'react';
import { useSelector } from 'react-redux';
import { TbCheck } from 'react-icons/tb';
import BenefitFilterToggle from '../../../../../components/BenefitFilterToggle';
import NoResult from '../../../../../components/NoResult';
import { RootState } from '../../../../../store';
import { BenefitDetailResponse } from '../../../types/api';
import {
  getMembershipGradeLabel,
  isGradeApplicableToProfile,
} from '../../../../../utils/membership';
import { groupDetailBenefitsByCarrier } from '../../../utils/benefitGrouping';

interface StoreDetailBenefitsProps {
  activeTab: 'default' | 'vipkok';
  setActiveTab: (tab: 'default' | 'vipkok') => void;
  detailData: BenefitDetailResponse | null;
  isLoading?: boolean;
}

const StoreDetailBenefits: React.FC<StoreDetailBenefitsProps> = ({
  activeTab,
  setActiveTab,
  detailData,
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

  const benefitGroups = groupDetailBenefitsByCarrier(
    detailData?.data?.tierBenefits ?? [],
    detailData?.data?.carrier
  );

  return (
    <>
      <BenefitFilterToggle
        value={activeTab}
        onChange={setActiveTab}
        width="w-full"
        fontSize="text-title-7 max-xl:text-title-8"
      />

      <div
        className={`${detailData?.data?.tierBenefits && detailData.data.tierBenefits.length > 0 ? 'mb-6 max-xl:-mt-2 max-xl:mb-4' : ''}`}
      >
        <h3 className="text-title-6 text-grey06 mb-2 max-xl:text-title-7 max-xl:mb-1.5">
          상세 혜택
        </h3>

        {benefitGroups.length > 0 ? (
          <div className="space-y-3 max-xl:space-y-2">
            {benefitGroups.map((group) => (
              <section
                key={group.key}
                className="rounded-2xl border border-grey02 bg-grey01/40 px-3.5 py-3 max-md:rounded-xl max-md:px-3 max-md:py-2.5"
              >
                <div className="mb-2 flex items-center gap-2 max-md:mb-1.5">
                  <span className="rounded-full bg-white px-2.5 py-1 text-body-4 font-bold text-purple04 shadow-sm max-md:text-body-5">
                    {group.label}
                  </span>
                  <span className="text-body-5 text-grey04">{group.benefits.length}개 혜택</span>
                </div>

                <div className="space-y-2 max-xl:space-y-1.5">
                  {group.benefits.map((benefit, index) => {
                    const isHighlighted = benefit.grades.some((grade) =>
                      isUserGrade(grade, benefit.carrier)
                    );

                    return (
                      <div
                        key={`${group.key}-${benefit.grades.join('-')}-${index}`}
                        className={`grid grid-cols-[20px_74px_minmax(0,1fr)] gap-2 rounded-xl bg-white px-2.5 py-2 items-start max-md:grid-cols-[16px_58px_minmax(0,1fr)] max-md:gap-1.5 max-md:px-2 ${
                          isHighlighted ? 'ring-1 ring-orange04/40' : ''
                        }`}
                      >
                        <TbCheck
                          size={20}
                          className={`mt-0.5 max-md:w-4 max-md:h-4 ${
                            isHighlighted ? 'text-orange04' : 'text-grey04'
                          }`}
                        />
                        <span
                          className={`text-body-3 max-xl:text-body-4 ${
                            isHighlighted ? 'text-orange04 font-bold' : 'text-grey05 font-medium'
                          }`}
                        >
                          {benefit.grades.map(getGradeDisplayName).join(', ')}
                        </span>
                        <span
                          className={`min-w-0 whitespace-pre-line break-words text-body-3 leading-relaxed max-xl:text-body-4 ${
                            isHighlighted ? 'text-orange04 font-bold' : 'text-grey05'
                          }`}
                        >
                          {benefit.context}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-2">
            <NoResult
              message1="혜택 정보가 없어요!"
              message2={`${activeTab === 'vipkok' ? 'VIP콕' : '기본'} 혜택이 존재하지 않아요`}
              message1FontSize="text-title-6"
              message2FontSize="text-body-3"
              isLoginRequired={false}
            />
          </div>
        )}

        {/* 구분선 - 혜택이 있을 때만 표시 */}
        {detailData?.data?.tierBenefits && detailData.data.tierBenefits.length > 0 && (
          <div className="border-b border-grey03 w-full mt-4 max-xl:mt-3" />
        )}
      </div>
    </>
  );
};

export default StoreDetailBenefits;
