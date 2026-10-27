import React from 'react';
import clsx from 'clsx';

const fieldLabels: Record<string, string> = {
  email: '이메일',
  password: '비밀번호',
  passwordConfirm: '비밀번호 확인',
  phoneNumber: '휴대폰 번호',
  verifiedPhoneNumber: '인증된 휴대폰 번호',
  nickname: '닉네임',
  verificationCode: '인증번호',
  oauthLinkEmail: '가입 이메일',
  oauthLinkPassword: '기존 계정 비밀번호',
};

type AuthInputProps = {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  autoCapitalize?: string;
  spellCheck?: boolean;
  required?: boolean;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  bgColor?: string; // 기본값: grey01
  textColor?: string; // 기본값: black
  placeholderColor?: string; // 기본값: grey03
  disabled?: boolean;
  disableFocusEffect?: boolean;
};

const AuthInput = ({
  name,
  label,
  type = 'text',
  placeholder = '',
  autoComplete,
  autoCapitalize,
  spellCheck,
  required = false,
  ariaInvalid,
  ariaDescribedBy,
  value,
  onChange,
  onKeyDown,
  className,
  bgColor = 'bg-grey01',
  textColor = 'text-ink',
  placeholderColor = 'placeholder-grey03',
  disabled = false,
}: AuthInputProps) => {
  const visibleLabel = label ?? fieldLabels[name] ?? placeholder;
  const inferredAutoComplete =
    type === 'password'
      ? 'current-password'
      : type === 'email' || name.toLowerCase().includes('email')
        ? 'email'
        : name === 'verificationCode'
          ? 'one-time-code'
          : name.toLowerCase().includes('phone')
            ? 'tel'
            : undefined;

  return (
    <div className="w-full min-w-0">
      {visibleLabel && (
        <label
          htmlFor={`auth-${name}`}
          className="mb-1.5 block text-sm font-semibold leading-5 text-ink"
        >
          {visibleLabel}
        </label>
      )}
      <input
        id={`auth-${name}`}
        name={name}
        type={type}
        autoComplete={autoComplete ?? inferredAutoComplete}
        autoCapitalize={autoCapitalize}
        spellCheck={spellCheck}
        required={required}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        placeholder={placeholder && placeholder !== visibleLabel ? placeholder : undefined}
        value={value}
        onChange={disabled ? undefined : onChange}
        onKeyDown={disabled ? undefined : onKeyDown}
        disabled={disabled}
        className={clsx(
          'h-12 w-full rounded-xl border border-warmBorder bg-warmSurface px-4 text-base font-normal text-ink placeholder:text-grey05 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-grey01 disabled:text-grey04',
          bgColor !== 'bg-grey01' && bgColor,
          textColor,
          placeholderColor,
          className
        )}
      />
    </div>
  );
};

export default AuthInput;
