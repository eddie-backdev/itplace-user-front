// src/features/myPage/components/MyInfo/MembershipInfo.tsx
import React from 'react';
import { getCarrierLabel, getMembershipGradeLabel } from '../../../../utils/membership';

type Props = {
  name: string;
  carrier?: string | null;
  grade?: string | null;
  verified?: boolean;
};

const MembershipInfo: React.FC<Props> = ({ name, carrier, grade, verified = false }) => {
  const hasProfile = Boolean(carrier && grade);
  const displayCarrier = getCarrierLabel(carrier);
  const displayGrade = getMembershipGradeLabel(grade);

  return (
    <div className="flex flex-col gap-4">
      {hasProfile ? (
        <>
          <p className="text-black text-title-2 mb-8 max-xl:text-title-4 max-xl:mb-4 max-xl:font-semibold max-xlg:mb-0 max-md:mb-4 max-sm:mb-0 max-md:text-grey05">
            안녕하세요{' '}
            <span className="text-purple04 text-title-2 max-xl:text-title-4 max-xl:font-semibold">
              {name.slice(1)}
            </span>
            님🐰
          </p>
          <p className="text-grey05 text-body-0 max-xl:text-body-2">
            {name.slice(1)}님이 선택한 멤버십 프로필은{' '}
            <span className="text-purple03 text-body-0-bold max-xl:text-body-2">
              {displayCarrier} · {displayGrade}
            </span>
            입니다.
            <br />
            통신 3사 혜택을 선택한 등급 기준으로 살펴보세요.
          </p>
          <p className="text-body-4 text-grey04 max-xl:text-body-5">
            {verified ? '통신사 인증 완료' : '자가 선택 정보 · 통신사 실인증 전'}
          </p>
          <div className="bg-gradient-myPage text-white text-[72px] font-bold text-center rounded-[18px] px-6 pb-0 pt-4 mt-10 max-xl:text-[52px] max-xl:px-3 max-xl:mt-4 max-xlg:text-[32px] max-xlg:mt-0 max-xlg:py-2 max-md:text-body-1-bold max-md:mt-0 max-md:py-3 max-md:rounded-xl">
            {displayGrade}
          </div>
        </>
      ) : (
        <>
          <p className="text-black text-title-2 mb-8 max-xl:text-title-4 max-xl:mb-4 max-xl:font-semibold max-xlg:mb-0 max-sm:mb-0 max-md:text-grey05">
            안녕하세요{' '}
            <span className="text-purple04 text-title-2 max-xl:text-title-4 max-xl:mb-4 max-xl:font-semibold">
              {name.slice(1)}
            </span>
            님🐰
          </p>
          <p className="text-grey05 text-body-0 max-xl:text-body-2">
            지금은{' '}
            <span className="text-purple03 text-body-0-bold max-xl:text-body-2-bold">
              멤버십 프로필 없이
            </span>{' '}
            이용 중이에요.
          </p>
          <p className="text-grey05 text-body-0 max-xl:text-body-2">
            회원 정보에서 통신사와 등급을 선택하면 맞춤 혜택을 더 쉽게 확인할 수 있어요.
          </p>
        </>
      )}
    </div>
  );
};

export default MembershipInfo;
