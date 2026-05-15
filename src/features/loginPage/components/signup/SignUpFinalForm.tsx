import { useState, useEffect, useRef } from 'react';
import { AxiosError } from 'axios';
import gsap from 'gsap';
import { showToast } from '../../../../utils/toast';
import AuthButton from '../common/AuthButton';
import EmailVerificationBox from '../verification/EmailVerificationBox';
import AuthFooter from '../common/AuthFooter';
import useValidation from '../../hooks/useValidation';
import { signUpFinal } from '../../apis/user';
import PasswordInputForm from '../common/PasswordInputForm';
import AuthInput from '../common/AuthInput';
import MembershipProfileSelector from '../../../../components/membership/MembershipProfileSelector';

type SignUpFinalFormProps = {
  onGoToLogin: () => void;
  phoneNumber: string;
  initialName?: string;
  initialBirthday?: string;
  initialGender?: string;
  initialCarrier?: string;
  initialMembershipGradeCode?: string;
};

const SignUpFinalForm = ({
  onGoToLogin,
  phoneNumber,
  initialName = '',
  initialBirthday = '',
  initialGender = '',
  initialCarrier = '',
  initialMembershipGradeCode = '',
}: SignUpFinalFormProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(
      wrapperRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.out' }
    );
  }, []);

  const [formData, setFormData] = useState({
    name: initialName,
    birthday: initialBirthday,
    gender: initialGender,
    carrier: initialCarrier,
    membershipGradeCode: initialMembershipGradeCode,
    email: '',
    password: '',
    passwordConfirm: '',
  });

  const [emailVerified, setEmailVerified] = useState(false);

  const { errors, validateAll, validateField } = useValidation();

  const handleChange = (field: keyof typeof formData, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    if (field === 'email' || field === 'password' || field === 'passwordConfirm') {
      validateField(field, value, updated);
    }

    if (field === 'birthday') {
      validateField('birth', value, {
        email: updated.email,
        password: updated.password,
        passwordConfirm: updated.passwordConfirm,
        birth: value,
      });
    }
  };

  const handleNext = async () => {
    const valid = validateAll(formData);
    if (!valid || !emailVerified || !isProfileValid) {
      showToast('입력 정보를 다시 확인해주세요.', 'error');
      return;
    }

    try {
      await signUpFinal({
        name: formData.name.trim(),
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        phoneNumber,
        gender: formData.gender,
        birthday: formData.birthday,
        carrier: formData.carrier,
        membershipGradeCode: formData.membershipGradeCode,
      });

      showToast('회원가입이 완료되었습니다. 로그인 해주세요.', 'success');
      setTimeout(() => onGoToLogin(), 0);
    } catch (error) {
      const axiosError = error as AxiosError<{ code: string; message: string }>;
      const res = axiosError.response?.data;
      let message = '회원가입에 실패했습니다. 다시 시도해주세요.';

      if (res) {
        switch (res.code) {
          case 'PASSWORD_MISMATCH':
            message = '비밀번호가 일치하지 않습니다.';
            break;
          case 'DUPLICATE_EMAIL':
            message = '이미 사용 중인 이메일입니다.';
            break;
          case 'DUPLICATE_PHONE_NUMBER':
            message = '이미 가입된 휴대폰 번호입니다.';
            break;
          case 'SMS_VERIFICATION_FAILURE':
            message = '휴대폰 인증이 만료되었습니다. 다시 인증해주세요.';
            break;
          default:
            message = res.message || message;
        }
      }

      showToast(message, 'error');
    }
  };

  const isProfileValid =
    phoneNumber &&
    formData.name.trim() &&
    formData.birthday.trim() &&
    (formData.gender === 'MALE' || formData.gender === 'FEMALE') &&
    formData.carrier &&
    formData.membershipGradeCode &&
    !errors.birth;

  const isValid =
    isProfileValid &&
    formData.email &&
    formData.password &&
    formData.passwordConfirm &&
    formData.password === formData.passwordConfirm &&
    !errors.email &&
    !errors.password &&
    !errors.passwordConfirm &&
    emailVerified;

  return (
    <div ref={wrapperRef} className="w-full max-h-full overflow-y-auto px-2 py-6 flex flex-col">
      <div className="w-[320px] max-xl:w-[274px] max-lg:w-[205px] max-md:w-full max-sm:w-full text-left mx-auto">
        <p className="text-title-4 max-xl:text-title-5 max-lg:text-title-6 max-md:text-title-5 max-sm:text-title-5">
          가입 정보를 입력해주세요
        </p>
        <p className="mt-3 text-body-5 text-grey04">
          휴대폰 인증 완료: <span className="font-semibold text-purple05">{phoneNumber}</span>
        </p>
      </div>

      <div className="w-full mt-[28px] max-xl:mt-[24px] max-lg:mt-[20px] max-md:mt-[24px] max-sm:mt-[24px] flex flex-col items-center gap-[14px]">
        <AuthInput
          name="name"
          placeholder="이름"
          value={formData.name}
          onChange={(event) => handleChange('name', event.target.value)}
        />

        <input
          type="date"
          name="birth"
          value={formData.birthday}
          onChange={(event) => handleChange('birthday', event.target.value)}
          className="w-[320px] max-xl:w-[274px] max-lg:w-[205px] max-md:w-full max-sm:w-full h-[48px] max-xl:h-[41px] max-lg:h-[32px] max-md:h-[48px] max-sm:h-[50px] px-[16px] max-xl:px-[14px] max-lg:px-[11px] max-md:px-[16px] max-sm:px-[16px] rounded-[18px] max-xl:rounded-[15px] max-lg:rounded-[12px] max-md:rounded-[16px] max-sm:rounded-[16px] border border-grey02 text-body-2 max-xl:text-body-3 max-lg:text-body-4 max-md:text-body-3 max-sm:text-body-3 text-grey05"
        />

        <div className="w-[320px] max-xl:w-[274px] max-lg:w-[205px] max-md:w-full max-sm:w-full flex gap-[14px]">
          <button
            type="button"
            className={`flex-1 h-[46px] max-lg:h-[34px] max-md:h-[46px] rounded-[16px] max-lg:rounded-[12px] border text-body-3 max-lg:text-body-4 transition ${
              formData.gender === 'MALE'
                ? 'bg-purple04 text-white border-purple04'
                : 'bg-white text-grey04 border-grey02'
            }`}
            onClick={() => handleChange('gender', 'MALE')}
          >
            남자
          </button>
          <button
            type="button"
            className={`flex-1 h-[46px] max-lg:h-[34px] max-md:h-[46px] rounded-[16px] max-lg:rounded-[12px] border text-body-3 max-lg:text-body-4 transition ${
              formData.gender === 'FEMALE'
                ? 'bg-purple04 text-white border-purple04'
                : 'bg-white text-grey04 border-grey02'
            }`}
            onClick={() => handleChange('gender', 'FEMALE')}
          >
            여자
          </button>
        </div>

        <div className="w-full flex flex-col items-center gap-2">
          <MembershipProfileSelector
            carrier={formData.carrier}
            membershipGradeCode={formData.membershipGradeCode}
            onCarrierChange={(carrier) => handleChange('carrier', carrier)}
            onGradeChange={(grade) => handleChange('membershipGradeCode', grade)}
          />
          <p className="w-[320px] max-xl:w-[274px] max-lg:w-[205px] max-md:w-full text-body-5 text-grey04">
            선택한 통신사와 등급으로 맞춤 혜택을 보여드려요.
          </p>
        </div>
      </div>

      <div className="w-full mt-[18px] flex justify-center">
        <EmailVerificationBox
          email={formData.email}
          onChangeEmail={(val) => {
            setEmailVerified(false);
            handleChange('email', val);
          }}
          onVerifiedChange={setEmailVerified}
          mode="signup"
        />
      </div>

      <div className="mt-[14px] w-full">
        <PasswordInputForm
          password={formData.password}
          passwordConfirm={formData.passwordConfirm}
          onChangePassword={(val) => handleChange('password', val)}
          onChangeConfirm={(val) => handleChange('passwordConfirm', val)}
          passwordError={errors.password}
          passwordConfirmError={errors.passwordConfirm}
        />
      </div>

      <div className="flex justify-center">
        <AuthButton
          label="회원가입"
          onClick={() => void handleNext()}
          variant={isValid ? 'default' : 'disabled'}
          className="mt-[32px] max-md:mt-[28px] max-sm:mt-[28px]"
        />
      </div>

      <div className="flex justify-center">
        <AuthFooter
          leftText="이미 회원이신가요?"
          rightText="로그인 하러 가기"
          onRightClick={onGoToLogin}
        />
      </div>
    </div>
  );
};

export default SignUpFinalForm;
