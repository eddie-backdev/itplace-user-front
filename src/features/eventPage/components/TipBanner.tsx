import React from 'react';
import { BiSolidMegaphone } from 'react-icons/bi';
import { useResponsive } from '../../../hooks/useResponsive';

const TipBanner: React.FC = () => {
  const { isMobile } = useResponsive();

  return (
    <section
      className={`bg-grey01 ${
        isMobile
          ? 'p-5 gap-2 mb-1'
          : 'mb-6 items-start gap-2 rounded-[10px] px-6 py-4 flex max-xl:p-4 max-xlg:flex-col max-md:hidden'
      }`}
    >
      {/* 아이콘 + Tip 텍스트 */}
      <div className={`flex ${isMobile ? 'flex-row' : 'mt-2'}`}>
        <BiSolidMegaphone
          className={`text-purple04 mr-2 animate-floating ${
            isMobile ? 'text-title-4 max-sm:text-title-5' : 'text-title-5'
          }`}
        />
        <span
          className={`text-black font-semibold max-xl:font-semibold animate-floating ${
            isMobile ? 'text-title-6 max-sm:text-title-7' : 'text-title-5 max-xl:text-title-6'
          }`}
        >
          Tip!
        </span>
      </div>

      {/* 설명 텍스트 */}
      <p
        className={`text-grey05 animate-floating mt-2 ${
          isMobile ? 'text-body-2 max-sm:text-body-4' : 'text-body-0 max-xl:text-body-1'
        }`}
      >
        멤버십 혜택 사용 후, 사용 내역을 기록하면 행운의 스크래치 쿠폰을 얻을 수 있어요! 지금 바로{' '}
        <span className="text-purple04 font-medium">잇플맵에서 혜택을 기록</span>해보세요 🐰
      </p>
    </section>
  );
};

export default TipBanner;
