import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import AuthButton from '../common/AuthButton';
import EmailVerificationBox from '../verification/EmailVerificationBox';
import PasswordInputForm from '../common/PasswordInputForm';
import useValidation from '../../hooks/useValidation';
import { showToast } from '../../../../utils/toast';

type SignUpAccountFormProps = {
  initialEmail?: string;
  initialPassword?: string;
  initialPasswordConfirm?: string;
  initialEmailVerified?: boolean;
  onEmailVerifiedChange: (verified: boolean) => void;
  onValuesChange: (
    data: Partial<{ email: string; password: string; passwordConfirm: string }>
  ) => void;
  onNext: (data: { email: string; password: string; passwordConfirm: string }) => void;
};

const SignUpAccountForm = ({
  initialEmail = '',
  initialPassword = '',
  initialPasswordConfirm = '',
  initialEmailVerified = false,
  onEmailVerifiedChange,
  onValuesChange,
  onNext,
}: SignUpAccountFormProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [passwordConfirm, setPasswordConfirm] = useState(initialPasswordConfirm);
  const [emailVerified, setEmailVerified] = useState(initialEmailVerified);
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
      <div className="w-full">
        <EmailVerificationBox
          email={email}
          onChangeEmail={(value) => {
            setEmailVerified(false);
            onEmailVerifiedChange(false);
            setEmail(value);
            onValuesChange({ email: value });
            validateField('email', value, { ...formData, email: value });
          }}
          initiallyVerified={initialEmailVerified}
          onVerifiedChange={(verified) => {
            setEmailVerified(verified);
            onEmailVerifiedChange(verified);
          }}
          mode="signup"
        />
      </div>

      <div className="mt-[18px] w-full">
        <PasswordInputForm
          password={password}
          passwordConfirm={passwordConfirm}
          onChangePassword={(value) => {
            setPassword(value);
            onValuesChange({ password: value });
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
            onValuesChange({ passwordConfirm: value });
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
        className="mt-[32px] !max-w-none max-md:mt-[28px] max-sm:mt-[28px]"
      />
    </div>
  );
};

export default SignUpAccountForm;
