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
  const displayName = name?.trim() || '회원';

  return (
    <div className="flex flex-col gap-4">
      {hasProfile ? (
        <>
          <div>
            <p className="text-body-3-bold text-purple03">나의 멤버십</p>
            <p className="mt-2 text-black text-title-3 max-xl:text-title-4 max-xl:font-semibold max-md:text-grey05">
              안녕하세요, <span className="text-purple04">{displayName}</span>님🐰
            </p>
          </div>
          <div className="rounded-[20px] bg-purple01/55 p-4">
            <p className="text-body-1 text-grey05 max-xl:text-body-2">선택한 멤버십 프로필은</p>
            <p className="mt-2 text-title-5 text-purple05 max-xl:text-title-7">
              {displayCarrier} · {displayGrade}
            </p>
            <p className="mt-3 text-body-4 text-grey04 max-xl:text-body-5">
              {verified ? '통신사 인증 완료' : '자가 선택 정보 · 통신사 실인증 전'}
            </p>
          </div>
          <div className="bg-gradient-myPage text-white text-[44px] font-bold text-center rounded-[22px] px-5 py-5 mt-2 shadow-[0_14px_28px_rgba(118,56,250,0.20)] max-xl:text-[36px] max-xl:px-4 max-xl:py-4 max-xlg:text-[30px] max-md:text-title-4 max-md:mt-0 max-md:py-4">
            {displayGrade}
          </div>
          <div className="rounded-[16px] border border-purple01 bg-white px-4 py-3">
            <p className="text-body-3 text-grey04">
              통신 3사 혜택을 선택한 등급 기준으로 추천하고 보여드려요.
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="text-body-3-bold text-purple03">나의 멤버십</p>
          <p className="text-black text-title-3 max-xl:text-title-4 max-xl:font-semibold max-md:text-grey05">
            안녕하세요, <span className="text-purple04">{displayName}</span>님🐰
          </p>
          <div className="rounded-[22px] border border-dashed border-purple02 bg-purple01/35 px-5 py-6">
            <p className="text-title-6 text-purple05">아직 멤버십 프로필이 없어요</p>
            <p className="mt-3 text-body-2 text-grey05 max-xl:text-body-3">
              회원 정보에서 통신사와 등급을 선택하면 맞춤 혜택을 더 쉽게 확인할 수 있어요.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default MembershipInfo;
