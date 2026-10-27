import { useState } from 'react';
import AuthInput from './AuthInput';
import ErrorMessage from './ErrorMessage';
import { TbEye, TbEyeOff } from 'react-icons/tb';

type Props = {
  password: string;
  passwordConfirm: string;
  onChangePassword: (val: string) => void;
  onChangeConfirm: (val: string) => void;
  passwordError?: string;
  passwordConfirmError?: string;
  className?: string;
};

const PasswordInputForm = ({
  password,
  passwordConfirm,
  onChangePassword,
  onChangeConfirm,
  passwordError,
  passwordConfirmError,
  className,
}: Props) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [touched, setTouched] = useState({
    password: false,
    passwordConfirm: false,
  });

  return (
    <div className={`flex w-full flex-col items-start ${className ?? ''}`}>
      {/* 비밀번호 입력 필드 */}
      <div className="w-full min-w-0 max-w-[400px]">
        <div className="relative">
          <AuthInput
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="비밀번호"
            autoComplete="new-password"
            value={password}
            className="pr-16"
            onChange={(e) => {
              onChangePassword(e.target.value);
              setTouched((prev) => ({ ...prev, password: true }));
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            className="signupPasswordToggle absolute right-1 top-[29px] flex h-11 w-11 items-center justify-center rounded-lg text-grey04 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {showPassword ? (
              <TbEyeOff size={18} className="text-[18px]" />
            ) : (
              <TbEye size={18} className="text-[18px]" />
            )}
          </button>
        </div>
        {touched.password && passwordError && <ErrorMessage message={passwordError} />}
      </div>

      {/* 비밀번호 확인 입력 필드 */}
      <div className="mt-4 w-full min-w-0 max-w-[400px]">
        <div className="relative">
          <AuthInput
            name="passwordConfirm"
            type={showPasswordConfirm ? 'text' : 'password'}
            placeholder="비밀번호 확인"
            autoComplete="new-password"
            value={passwordConfirm}
            className="pr-16"
            onChange={(e) => {
              onChangeConfirm(e.target.value);
              setTouched((prev) => ({ ...prev, passwordConfirm: true }));
            }}
          />
          <button
            type="button"
            onClick={() => setShowPasswordConfirm((prev) => !prev)}
            aria-label={showPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
            className="signupPasswordToggle absolute right-1 top-[29px] flex h-11 w-11 items-center justify-center rounded-lg text-grey04 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {showPasswordConfirm ? (
              <TbEyeOff size={18} className="text-[18px]" />
            ) : (
              <TbEye size={18} className="text-[18px]" />
            )}
          </button>
        </div>
        {touched.passwordConfirm && passwordConfirmError && (
          <ErrorMessage message={passwordConfirmError} />
        )}
      </div>
    </div>
  );
};

export default PasswordInputForm;
