import { useState } from 'react';
import AuthInput from '../common/AuthInput';
import MembershipProfileSelector from '../../../../components/membership/MembershipProfileSelector';
import AuthButton from '../common/AuthButton';
import AuthFooter from '../common/AuthFooter';
import EmailVerificationBox from '../verification/EmailVerificationBox';

type OAuthIntegrationFormProps = {
  name: string;
  birthday: string;
  gender: string;
  carrier: string;
  membershipGradeCode: string;
  onGoToLogin: () => void;
  onNext: (data: {
    name: string;
    email: string;
    birthday: string;
    gender: string;
    carrier: string;
    membershipGradeCode: string;
  }) => void;
};

const OAuthIntegrationForm = ({
  name,
  birthday: initialBirthday,
  gender: initialGender,
  carrier: initialCarrier,
  membershipGradeCode: initialMembershipGradeCode,
  onGoToLogin,
  onNext,
}: OAuthIntegrationFormProps) => {
  const [nameValue, setNameValue] = useState(name);
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [birthday, setBirthday] = useState(initialBirthday);
  const [gender, setGender] = useState(initialGender);
  const [carrier, setCarrier] = useState(initialCarrier);
  const [membershipGradeCode, setMembershipGradeCode] = useState(initialMembershipGradeCode);

  const isValid =
    !!nameValue.trim() &&
    emailVerified &&
    !!birthday &&
    (gender === 'MALE' || gender === 'FEMALE') &&
    !!carrier &&
    !!membershipGradeCode;

  return (
    <div className="w-full flex flex-col items-center">
      <div className="mb-5 w-[320px] text-left max-xl:w-[274px] max-lg:w-[205px] max-md:w-full max-sm:w-full">
        <p className="text-body-3 font-semibold text-grey06 max-md:text-body-2">카카오 가입 정보</p>
      </div>

      <div className="mb-[20px] max-md:mb-[16px] max-sm:mb-[16px] w-full flex justify-center">
        <AuthInput
          name="name"
          placeholder="이름"
          value={nameValue}
          onChange={(event) => setNameValue(event.target.value)}
        />
      </div>

      <div className="mb-[20px] max-md:mb-[16px] max-sm:mb-[16px] w-full flex justify-center">
        <EmailVerificationBox
          email={email}
          onChangeEmail={setEmail}
          onVerifiedChange={setEmailVerified}
          mode="signup"
        />
      </div>

      <div className="mb-[20px] max-md:mb-[16px] max-sm:mb-[16px] w-full flex justify-center">
        <input
          type="date"
          name="birth"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          className="w-[320px] max-xl:w-[274px] max-lg:w-[205px] max-md:w-full max-sm:w-full h-[48px] max-xl:h-[41px] max-lg:h-[32px] max-md:h-[46px] max-sm:h-[46px] px-[16px] max-xl:px-[14px] max-lg:px-[11px] max-md:px-[16px] max-sm:px-[16px] rounded-[18px] max-xl:rounded-[15px] max-lg:rounded-[12px] max-md:rounded-[16px] max-sm:rounded-[16px] border border-grey02 text-body-2 max-md:text-body-3 max-sm:text-body-3 text-grey05"
        />
      </div>

      <div className="mb-[20px] max-xl:mb-[17px] max-lg:mb-[13px] max-md:mb-[16px] max-sm:mb-[16px] w-full flex justify-center gap-[16px] max-xl:gap-[14px] max-lg:gap-[11px] max-md:gap-[14px] max-sm:gap-[14px]">
        <button
          type="button"
          onClick={() => setGender('MALE')}
          className={`w-[150px] max-xl:w-[128px] max-lg:w-[96px] max-md:flex-1 max-sm:flex-1 h-[48px] max-xl:h-[41px] max-lg:h-[32px] max-md:h-[46px] max-sm:h-[46px] rounded-[18px] max-xl:rounded-[15px] max-lg:rounded-[12px] max-md:rounded-[16px] max-sm:rounded-[16px] border text-body-2 max-md:text-body-3 max-sm:text-body-3 transition ${
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
          className={`w-[150px] max-xl:w-[128px] max-lg:w-[96px] max-md:flex-1 max-sm:flex-1 h-[48px] max-xl:h-[41px] max-lg:h-[32px] max-md:h-[46px] max-sm:h-[46px] rounded-[18px] max-xl:rounded-[15px] max-lg:rounded-[12px] max-md:rounded-[16px] max-sm:rounded-[16px] border text-body-2 max-md:text-body-3 max-sm:text-body-3 transition ${
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
        <p className="w-[320px] text-body-5 text-grey04 max-xl:w-[274px] max-lg:w-[205px] max-md:w-full">
          선택한 등급 기준으로 가입됩니다.
        </p>
      </div>

      <AuthButton
        label="가입하기"
        onClick={() =>
          onNext({
            name: nameValue.trim(),
            email,
            birthday,
            gender,
            carrier,
            membershipGradeCode,
          })
        }
        variant={isValid ? 'default' : 'disabled'}
      />

      <AuthFooter
        leftText="이미 회원이신가요?"
        rightText="로그인 하러 가기"
        onRightClick={onGoToLogin}
      />
    </div>
  );
};

export default OAuthIntegrationForm;
