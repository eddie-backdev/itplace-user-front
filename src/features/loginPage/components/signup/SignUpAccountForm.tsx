import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import AuthButton from '../common/AuthButton';
import AuthInput from '../common/AuthInput';
import EmailVerificationBox from '../verification/EmailVerificationBox';
import PasswordInputForm from '../common/PasswordInputForm';
import useValidation from '../../hooks/useValidation';
import { showToast } from '../../../../utils/toast';

type SignUpAccountFormProps = {
  initialEmail?: string;
  initialPassword?: string;
  initialPasswordConfirm?: string;
  phoneNumber: string;
  onNext: (data: { email: string; password: string; passwordConfirm: string }) => void;
};

const SignUpAccountForm = ({
  initialEmail = '',
  initialPassword = '',
  initialPasswordConfirm = '',
  phoneNumber,
  onNext,
}: SignUpAccountFormProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [passwordConfirm, setPasswordConfirm] = useState(initialPasswordConfirm);
  const [emailVerified, setEmailVerified] = useState(false);
  const { errors, validateAll, validateField } = useValidation();

  useEffect(() => {
    gsap.fromTo(
      wrapperRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.out' }
    );
  }, []);

  const formData = { email, password, passwordConfirm };

  const handleNext = () => {
    const isValidFields = validateAll(formData);

    if (!isValidFields || !emailVerified) {
      showToast('이메일 인증과 비밀번호를 다시 확인해주세요.', 'error');
      return;
    }

    onNext({ email, password, passwordConfirm });
  };

  const isValid =
    emailVerified &&
    email &&
    password &&
    passwordConfirm &&
    password === passwordConfirm &&
    !errors.email &&
    !errors.password &&
    !errors.passwordConfirm;

  return (
    <div ref={wrapperRef} className="flex w-full flex-col items-center">
      <div className="mb-4 w-[320px] text-left max-xl:w-[274px] max-lg:w-[205px] max-md:w-full max-sm:w-full">
        <p className="text-body-3 font-semibold text-grey06 max-md:text-body-2">계정 정보</p>
        <p className="mt-1.5 text-body-5 text-grey04">이메일과 비밀번호를 설정해 주세요.</p>
      </div>

      <div className="mb-3 w-full flex justify-center">
        <div className="w-[320px] max-xl:w-[274px] max-lg:w-[205px] max-md:w-full max-sm:w-full">
          <p className="mb-1.5 text-caption font-semibold text-grey04">인증된 휴대폰 번호</p>
          <AuthInput
            name="verifiedPhoneNumber"
            value={phoneNumber}
            disabled
            bgColor="bg-purple01/45"
            textColor="text-purple05"
            className="font-semibold"
          />
        </div>
      </div>

      <div className="w-full flex justify-center">
        <EmailVerificationBox
          email={email}
          onChangeEmail={(value) => {
            setEmailVerified(false);
            setEmail(value);
            validateField('email', value, { ...formData, email: value });
          }}
          onVerifiedChange={setEmailVerified}
          mode="signup"
        />
      </div>

      <div className="mt-[18px] w-full">
        <PasswordInputForm
          password={password}
          passwordConfirm={passwordConfirm}
          onChangePassword={(value) => {
            setPassword(value);
            validateField('password', value, { ...formData, password: value });
            if (passwordConfirm) {
              validateField('passwordConfirm', passwordConfirm, {
                ...formData,
                password: value,
              });
            }
          }}
          onChangeConfirm={(value) => {
            setPasswordConfirm(value);
            validateField('passwordConfirm', value, { ...formData, passwordConfirm: value });
          }}
          passwordError={errors.password}
          passwordConfirmError={errors.passwordConfirm}
        />
      </div>

      <AuthButton
        label="다음"
        onClick={handleNext}
        variant={isValid ? 'default' : 'disabled'}
        className="mt-[32px] max-md:mt-[28px] max-sm:mt-[28px]"
      />
    </div>
  );
};

export default SignUpAccountForm;
