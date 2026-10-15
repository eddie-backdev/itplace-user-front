import { useState } from 'react';
import AuthButton from '../common/AuthButton';
import EmailVerificationBox from '../verification/EmailVerificationBox';
import PasswordInputForm from '../common/PasswordInputForm';
import useValidation from '../../hooks/useValidation';
import { showToast } from '../../../../utils/toast';
import styles from './SignupForm.module.css';

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
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [passwordConfirm, setPasswordConfirm] = useState(initialPasswordConfirm);
  const [emailVerified, setEmailVerified] = useState(initialEmailVerified);
  const { errors, validateAll, validateField } = useValidation();

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
    <div className={`${styles.signupForm} flex w-full flex-col items-center`}>
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

      <div className="mt-[22px] w-full">
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
          className="signupPassword"
        />
      </div>

      <AuthButton
        label="다음"
        onClick={handleNext}
        variant={isValid ? 'default' : 'disabled'}
        className="signupCta mt-7 !max-w-none"
      />
    </div>
  );
};

export default SignUpAccountForm;
