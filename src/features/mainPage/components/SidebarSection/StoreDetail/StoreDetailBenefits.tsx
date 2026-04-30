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

        {detailData?.data?.tierBenefits && detailData.data.tierBenefits.length > 0 ? (
          <div className="space-y-1 max-xl:space-y-0.5">
            {detailData.data.tierBenefits.map((b, i) => (
              <div
                key={i}
                className="grid grid-cols-[20px_60px_1fr] gap-2 items-center max-md:grid-cols-[16px_50px_1fr] max-md:gap-1.5"
              >
                <TbCheck size={20} className="text-grey04 max-md:w-4 max-md:h-4" />
                <span
                  className={`text-body-3 max-xl:text-body-4 ${
                    isUserGrade(b.grade, b.carrier) ? 'text-orange04 font-bold' : 'text-grey05'
                  }`}
                >
                  {getGradeDisplayName(b.grade)}
                </span>
                <span
                  className={`text-body-3 max-xl:text-body-4 ${
                    isUserGrade(b.grade, b.carrier) ? 'text-orange04 font-bold' : 'text-grey05'
                  }`}
                >
                  {b.context?.split('\n')[0]}
                </span>
              </div>
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
