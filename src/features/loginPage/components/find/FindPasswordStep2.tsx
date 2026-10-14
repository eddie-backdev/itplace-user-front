import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import AuthButton from '../common/AuthButton';
import ErrorMessage from '../common/ErrorMessage';
import AuthFooter from '../common/AuthFooter';
import useValidation from '../../hooks/useValidation';
import { resetPassword } from '../../apis/user';
import { showToast } from '../../../../utils/toast';
import PasswordInputForm from '../common/PasswordInputForm';

type Props = {
  onGoToLogin: () => void;
  email: string;
  resetPasswordToken: string;
};

const FindPasswordStep2 = ({ onGoToLogin, email, resetPasswordToken }: Props) => {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const { errors, validateField } = useValidation();
  const [serverError, setServerError] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(
      wrapperRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.out' }
    );
  }, []);

  const handleSubmit = async () => {
    if (!isValid) return;

    try {
      await resetPassword({
        resetPasswordToken,
        email,
        newPassword: password,
        newPasswordConfirm: passwordConfirm,
      });

      showToast('비밀번호가 성공적으로 변경되었습니다.', 'success');
      onGoToLogin(); // 예: 로그인 페이지로 이동 등
    } catch (err: unknown) {
      let msg = '비밀번호 변경에 실패했습니다.';
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data
      ) {
        msg = (err.response.data as { message: string }).message;
      }
      setServerError(msg);
      showToast(msg, 'error');
    }
  };

  useEffect(() => {
    validateField('password', password, { email, password, passwordConfirm });
    validateField('passwordConfirm', passwordConfirm, { email, password, passwordConfirm });
  }, [password, passwordConfirm, validateField, email]);

  const isValid =
    password &&
    passwordConfirm &&
    password === passwordConfirm &&
    !errors?.password &&
    !errors?.passwordConfirm;

  return (
    <div ref={wrapperRef} className="flex w-full flex-col items-start">
      <div className="w-full max-w-[400px] text-left">
        <h1 className="text-[28px] font-semibold leading-[1.3] tracking-[-0.035em] text-ink">
          새 비밀번호를 설정하세요
        </h1>
        <p className="mt-2 text-[14px] leading-6 text-warmMuted sm:text-[15px]">
          새 비밀번호와 확인 값을 입력해주세요.
        </p>
      </div>

      <div className="mt-7 w-full max-w-[400px]">
        <PasswordInputForm
          password={password}
          passwordConfirm={passwordConfirm}
          onChangePassword={setPassword}
          onChangeConfirm={setPasswordConfirm}
          passwordError={errors.password}
          passwordConfirmError={errors.passwordConfirm}
        />
      </div>

      {serverError && (
        <div className="mt-4 w-full max-w-[400px] break-words">
          <ErrorMessage message={serverError} />
        </div>
      )}

      <AuthButton
        className="mt-6 h-[52px] !max-w-[400px]"
        label="비밀번호 변경"
        onClick={handleSubmit}
        variant={isValid ? 'default' : 'disabled'}
      />

      <div className="w-full max-w-[400px]">
        <AuthFooter
          leftText="비밀번호가 기억나셨다면?"
          rightText="로그인 하러 가기"
          onRightClick={onGoToLogin}
        />
      </div>
    </div>
  );
};

export default FindPasswordStep2;
