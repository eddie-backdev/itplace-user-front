// src/features/myPage/components/MyInfo/UserInfoForm.tsx
import React from 'react';
import { getCarrierLabel, getMembershipGradeLabel } from '../../../../utils/membership';

type Props = {
  name: string;
  gender: string;
  birthday: string;
  phoneNumber: string;
  email: string;
  carrier?: string | null;
  membershipGradeCode?: string | null;
  onChangeMembershipProfileClick?: () => void;
  onChangePasswordClick?: () => void;
  onDeleteClick?: () => void;
};

const UserInfoForm: React.FC<Props> = ({
  name,
  gender,
  birthday,
  phoneNumber,
  email,
  carrier,
  membershipGradeCode,
  onChangeMembershipProfileClick,
  onChangePasswordClick,
  onDeleteClick,
}) => {
  const hasMembershipProfile = Boolean(carrier && membershipGradeCode);

  return (
    <div className="flex justify-center">
      <div className="flex w-full max-w-[720px] min-w-[560px] flex-col gap-3 max-xl:min-w-[370px] max-xlg:w-full max-md:min-w-0">
        <InfoRow label="이름" value={name} />
        <InfoRow label="성별" value={gender === 'MALE' ? '남성' : '여성'} />
        <InfoRow label="생년월일" value={birthday.replace(/-/g, '.')} />
        <InfoRow label="휴대폰 번호" value={phoneNumber} />
        <InfoRow label="이메일" value={email} />

        <div className="flex items-start gap-4 rounded-[22px] border border-purple01 bg-purple01/25 p-4 max-md:flex-col max-md:items-start max-md:gap-2 max-md:border-grey02 max-md:bg-white">
          <div className="w-full max-w-[140px] text-title-6 text-black font-bold max-xl:max-w-[120px] max-md:max-w-none max-md:text-body-3-bold max-md:text-grey05">
            멤버십 프로필
          </div>
          <div className="flex flex-1 items-center justify-between gap-3 max-md:w-full">
            <div>
              <p className="text-body-1-bold text-purple05 max-xl:text-body-2-bold">
                {hasMembershipProfile
                  ? `${getCarrierLabel(carrier)} · ${getMembershipGradeLabel(membershipGradeCode)}`
                  : '아직 선택하지 않았어요'}
              </p>
              <p className="mt-1 text-body-5 text-grey04">
                통신사와 등급은 본인이 선택한 정보이며, 별도 통신사 실인증 상태가 아니에요.
              </p>
            </div>
            <button
              type="button"
              onClick={onChangeMembershipProfileClick}
              className="shrink-0 rounded-full bg-purple04 px-4 py-2 text-body-3-bold text-white transition hover:bg-purple05"
            >
              변경
            </button>
          </div>
        </div>

        {/* 비밀번호 row */}
        <div className="flex items-center gap-4 rounded-[18px] border border-grey02 bg-white px-4 py-3 max-md:flex-col max-md:items-start max-md:gap-2">
          <div className="w-full max-w-[140px] text-title-6 text-black font-bold max-xl:max-w-[120px] max-md:max-w-none max-md:text-body-3-bold max-md:text-grey05">
            비밀번호
          </div>
          <div className="flex-1 w-full">
            <div className="flex-1 flex items-center justify-between">
              <span className="tracking-widest select-none text-grey04">●●●●●●●●</span>
              <button
                type="button"
                className="rounded-full bg-purple01 px-4 py-2 text-body-2-bold text-purple04 transition hover:bg-purple02 max-xl:text-body-3-bold"
                onClick={onChangePasswordClick}
              >
                변경하기
              </button>
            </div>
          </div>
        </div>

        {/* 회원탈퇴 버튼 */}
        <div className="flex justify-end mt-4">
          <button
            type="button"
            className="rounded-[14px] border border-grey02 bg-white px-5 py-3 text-body-2-bold text-grey04 transition hover:border-danger hover:text-danger max-md:w-full"
            onClick={onDeleteClick}
          >
            회원탈퇴
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center gap-4 rounded-[18px] border border-grey02 bg-white px-4 py-3 max-md:flex-col max-md:items-start max-md:gap-2">
    {/* 왼쪽 라벨 */}
    <div className="w-full max-w-[140px] text-title-6 text-black font-bold max-xl:max-w-[120px] max-md:max-w-none max-md:text-body-3-bold max-md:text-grey05">
      {label}
    </div>
    {/* 오른쪽 값 박스 */}
    <div className="flex-1 w-full text-body-1 text-grey05 max-xl:text-body-2 max-md:text-grey04">
      {value || '\u00A0'}
    </div>
  </div>
);

export default UserInfoForm;
