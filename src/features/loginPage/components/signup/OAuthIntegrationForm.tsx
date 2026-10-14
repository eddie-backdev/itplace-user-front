import { useState } from 'react';
import AuthInput from '../common/AuthInput';
import MembershipProfileSelector from '../../../../components/membership/MembershipProfileSelector';
import AuthButton from '../common/AuthButton';
import BirthDateInput from './BirthDateInput';
import {
  birthDateInputToApiDate,
  formatBirthDateInput,
  isCompleteBirthDateInput,
} from '../../utils/birthDate';

type OAuthIntegrationFormProps = {
  nickname: string;
  email: string;
  birthday: string;
  gender: string;
  carrier: string;
  membershipGradeCode: string;
  onNext: (data: {
    nickname: string;
    email: string;
    birthday: string;
    gender: string;
    carrier: string;
    membershipGradeCode: string;
  }) => void;
};

const OAuthIntegrationForm = ({
  nickname,
  email,
  birthday: initialBirthday,
  gender: initialGender,
  carrier: initialCarrier,
  membershipGradeCode: initialMembershipGradeCode,
  onNext,
}: OAuthIntegrationFormProps) => {
  const [nicknameValue, setNicknameValue] = useState(nickname);
  const [birthday, setBirthday] = useState(formatBirthDateInput(initialBirthday));
  const [gender, setGender] = useState(initialGender);
  const [carrier, setCarrier] = useState(initialCarrier);
  const [membershipGradeCode, setMembershipGradeCode] = useState(initialMembershipGradeCode);

  const isValid =
    !!nicknameValue.trim() &&
    !!email &&
    isCompleteBirthDateInput(birthday) &&
    (gender === 'MALE' || gender === 'FEMALE') &&
    !!carrier &&
    !!membershipGradeCode;

  return (
    <div className="w-full flex flex-col items-center">
      <div className="mb-5 w-full max-w-[320px] text-left">
        <p className="text-body-3 font-semibold text-grey06 max-md:text-body-2">카카오 가입 정보</p>
        <p className="mt-2 text-body-5 text-grey04">
          카카오에서 인증된 이메일을 사용하고, 부족한 정보만 입력합니다.
        </p>
      </div>

      <div className="mb-[14px] max-md:mb-[12px] max-sm:mb-[12px] w-full flex justify-center">
        <AuthInput
          name="nickname"
          placeholder="닉네임"
          value={nicknameValue}
          onChange={(event) => setNicknameValue(event.target.value)}
        />
      </div>

      <div className="mb-5 w-full max-w-[320px] rounded-xl border border-warmBorder bg-grey01 px-4 py-3 text-left">
        <p className="text-body-5 font-semibold text-purple04">카카오 인증 이메일</p>
        <p className="mt-1 truncate text-body-2-bold text-grey06 max-lg:text-body-3-bold">
          {email || '카카오 인증 이메일을 확인할 수 없어요'}
        </p>
        <p className="mt-1 text-caption text-grey04">
          이메일 인증은 카카오 인증 정보로 대체됩니다.
        </p>
      </div>

      <div className="mb-[20px] flex w-full justify-center max-md:mb-[16px] max-sm:mb-[16px]">
        <BirthDateInput value={birthday} onChange={setBirthday} />
      </div>

      <div className="mb-[20px] max-xl:mb-[17px] max-lg:mb-[13px] max-md:mb-[16px] max-sm:mb-[16px] w-full flex justify-center gap-[16px] max-xl:gap-[14px] max-lg:gap-[11px] max-md:gap-[14px] max-sm:gap-[14px]">
        <button
          type="button"
          onClick={() => setGender('MALE')}
          aria-pressed={gender === 'MALE'}
          className={`h-12 flex-1 rounded-xl border text-body-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
            gender === 'MALE'
              ? 'bg-purple04 text-white border-purple04'
              : 'bg-white text-grey04 border-grey02'
          }`}
        >
          남자
        </button>
        <button
          type="button"
          onClick={() => setGender('FEMALE')}
          aria-pressed={gender === 'FEMALE'}
          className={`h-12 flex-1 rounded-xl border text-body-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
            gender === 'FEMALE'
              ? 'bg-purple04 text-white border-purple04'
              : 'bg-white text-grey04 border-grey02'
          }`}
        >
          여자
        </button>
      </div>

      <div className="mb-[20px] max-md:mb-[16px] max-sm:mb-[16px] w-full flex flex-col items-center gap-2">
        <MembershipProfileSelector
          carrier={carrier}
          membershipGradeCode={membershipGradeCode}
          onCarrierChange={setCarrier}
          onGradeChange={setMembershipGradeCode}
        />
        <p className="w-full max-w-[320px] text-body-3 text-grey05">
          선택한 등급 기준으로 가입됩니다.
        </p>
      </div>

      <AuthButton
        label="가입하기"
        onClick={() =>
          onNext({
            nickname: nicknameValue.trim(),
            email,
            birthday: birthDateInputToApiDate(birthday),
            gender,
            carrier,
            membershipGradeCode,
          })
        }
        variant={isValid ? 'default' : 'disabled'}
      />
    </div>
  );
};

export default OAuthIntegrationForm;
