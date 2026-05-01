import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Platform } from '../../../types';
import { TbChevronDown, TbCheck, TbChevronUp } from 'react-icons/tb';
import { RootState } from '../../../../../store';
import AddressTooltip from './AddressTooltip';
import { showToast } from '../../../../../utils/toast';
import {
  getMembershipGradeLabel,
  isGradeApplicableToProfile,
} from '../../../../../utils/membership';
import { groupPlatformBenefitsByCarrier } from '../../../utils/benefitGrouping';

interface StoreCardProps {
  platform: Platform;
  isSelected: boolean;
  onSelect: (platform: Platform) => void;
}

const StoreCard: React.FC<StoreCardProps> = ({ platform, onSelect }) => {
  // Redux에서 사용자 등급 가져오기
  const user = useSelector((state: RootState) => state.auth.user);

  // 등급 표시명 변환 헬퍼 함수
  const getGradeDisplayName = (grade: string) => getMembershipGradeLabel(grade);

  const benefitGroups = groupPlatformBenefitsByCarrier(platform);

  // 주소 툴팁 상태 관리
  const [showAddressTooltip, setShowAddressTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // 복사 기능
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('복사가 완료되었습니다.', 'success');
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  // 툴팁 외부 클릭시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowAddressTooltip(false);
      }
    };

    if (showAddressTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddressTooltip]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${platform.name} 상세 보기`}
      className="group cursor-pointer transition-colors duration-200 w-full px-5 bg-white hover:bg-grey01 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 max-md:px-4 max-sm:px-3"
      onClick={() => onSelect(platform)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(platform);
        }
      }}
    >
      <div className="py-4 max-md:py-3 w-[330px] max-md:w-full">
        {/* 상단부: 가맹점 정보 + 로고 */}
        <div className="flex justify-between items-start mb-4 max-md:mb-3">
          {/* 왼쪽: 가맹점 정보 2줄 */}
          <div className="flex flex-col">
            {/* 1줄: 가맹점명 + 카테고리 */}
            <div className="flex items-center gap-4 mb-2 truncate max-md:gap-3 max-md:mb-1.5">
              <span className="text-title-7 font-bold text-grey06 max-md:text-body-1-bold">
                {platform.name}
              </span>
              <span className="text-body-5 text-grey04 max-md:text-body-6">
                {platform.category}
              </span>
            </div>
            {/* 2줄: 거리 + 주소 */}
            <div className="flex items-center gap-3 mb-1 relative max-md:gap-2">
              <span className="text-body-3-bold text-black max-md:text-body-4-bold">
                {platform.distance}km
              </span>
              <span className="text-body-3 text-grey04 truncate w-[20ch] max-md:text-body-4 max-md:w-[15ch]">
                {platform.roadName}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddressTooltip(!showAddressTooltip);
                }}
                aria-label={showAddressTooltip ? '주소 접기' : '주소 펼치기'}
                className="rounded-full hover:text-grey05 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
              >
                {showAddressTooltip ? (
                  <TbChevronUp size={16} className="text-grey04 max-md:w-4 max-md:h-4" />
                ) : (
                  <TbChevronDown size={16} className="text-grey04 max-md:w-4 max-md:h-4" />
                )}
              </button>

              {/* 주소 툴팁 */}
              {showAddressTooltip && (
                <div ref={tooltipRef} className="absolute top-full left-0 mt-2 z-50">
                  <AddressTooltip
                    roadAddress={platform.roadAddress}
                    lotAddress={platform.address}
                    onCopy={handleCopy}
                    onClose={() => setShowAddressTooltip(false)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 브랜드 로고 */}
          <div className="w-[45px] h-[45px] flex items-center justify-center flex-shrink-0 max-md:w-[40px] max-md:h-[40px]">
            {platform.imageUrl ? (
              <img
                src={platform.imageUrl}
                alt={`${platform.name} 로고`}
                className="w-full h-full object-contain rounded"
              />
            ) : (
              <div className="w-full h-full bg-red-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">{platform.name.charAt(0)}</span>
              </div>
            )}
          </div>
        </div>

        {/* 하단부: 혜택 내용 박스 */}
        <div className="rounded-[10px] p-3 w-full bg-grey01 group-hover:bg-white max-md:p-2 max-sm:p-1.5">
          <div className="text-body-3-bold text-grey05 mb-2 max-md:text-body-4-bold max-md:mb-1.5">
            혜택 내용
          </div>

          <div className="space-y-2 max-md:space-y-1.5">
            {benefitGroups.map((group) => (
              <section
                key={group.key}
                className="rounded-xl border border-grey02 bg-white/70 px-2.5 py-2 max-md:px-2 max-md:py-1.5"
              >
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className="rounded-full bg-purple01 px-2 py-0.5 text-body-5 font-bold text-purple04 max-md:text-body-6">
                    {group.label}
                  </span>
                  <span className="text-body-6 text-grey04">{group.benefits.length}개</span>
                </div>

                <div className="space-y-1 max-md:space-y-0.5">
                  {group.benefits.map((benefit, index) => {
                    const isMatchedGrade =
                      benefit.grades.some((grade) =>
                        isGradeApplicableToProfile({
                          benefitCarrier: benefit.carrier,
                          benefitGrade: grade,
                          userCarrier: user?.carrier,
                          userGrade: user?.membershipGradeCode ?? user?.membershipGrade,
                        })
                      ) && benefit.context !== '-';

                    return (
                      <div
                        key={`${group.key}-${benefit.grades.join('-')}-${index}`}
                        className="grid grid-cols-[20px_68px_minmax(0,1fr)] gap-2 items-start max-md:grid-cols-[16px_56px_minmax(0,1fr)] max-md:gap-1.5"
                      >
                        <TbCheck
                          size={16}
                          className={`mt-0.5 max-md:w-4 max-md:h-4 ${
                            isMatchedGrade ? 'text-orange04' : 'text-grey04'
                          }`}
                        />
                        <span
                          className={`text-body-4 max-md:text-body-5 ${
                            isMatchedGrade ? 'text-orange04 font-bold' : 'text-grey05 font-medium'
                          }`}
                        >
                          {benefit.grades.map(getGradeDisplayName).join(', ')}
                        </span>
                        <span
                          className={`min-w-0 whitespace-pre-line break-words text-body-4 leading-relaxed max-md:text-body-5 ${
                            isMatchedGrade ? 'text-orange04 font-bold' : 'text-grey05'
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
        </div>
      </div>
    </div>
  );
};

export default StoreCard;
