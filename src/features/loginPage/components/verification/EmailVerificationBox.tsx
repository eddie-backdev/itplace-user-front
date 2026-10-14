import { useState, useEffect } from 'react';
import AuthInput from '../common/AuthInput';
import ErrorMessage from '../common/ErrorMessage';
import useEmailVerification from '../../hooks/useEmailVerification';
import LoadingSpinner from '../../../../components/LoadingSpinner';

type Props = {
  email: string;
  initiallyVerified?: boolean;
  onChangeEmail: (val: string) => void;
  onVerifiedChange?: (verified: boolean) => void;
  mode?: 'signup' | 'reset';
  onResetTokenChange?: (token: string) => void;
  onDuplicateEmail?: (email: string) => void;
};

const EmailVerificationBox = ({
  email,
  initiallyVerified = false,
  onChangeEmail,
  onVerifiedChange,
  mode,
  onResetTokenChange,
  onDuplicateEmail,
}: Props) => {
  const [code, setCode] = useState('');
  const [manualLoading, setManualLoading] = useState(false); // 버튼 로딩 전용
  const {
    emailSent,
    emailVerified,
    errorMessage,
    sendCode,
    verifyCode,
    loading, // useEmailVerification 내부 로딩
  } = useEmailVerification({
    email,
    initiallyVerified,
    onVerifiedChange,
    mode,
    onResetTokenChange,
    onDuplicateEmail,
  });

  // 이메일이 변경되면 인증번호 입력 초기화
  useEffect(() => {
    setCode('');
  }, [email]);

  const handleSendCode = async () => {
    setManualLoading(true);
    try {
      await sendCode();
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[320px]">
      {emailVerified && (
        <p role="status" className="mb-2 text-sm font-medium text-brandStrong">
          이메일 인증 완료
        </p>
      )}
      {/* 이메일 입력 */}
      <div className="relative">
        <AuthInput
          name="email"
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => onChangeEmail(e.target.value)}
          disabled={emailVerified}
          className={!emailVerified ? 'pr-24' : ''}
        />
        {!emailVerified && (
          <button
            type="button"
            onClick={handleSendCode}
            disabled={!email || manualLoading}
            className={`absolute right-1 top-[31px] h-10 min-w-[68px] rounded-lg px-2 text-body-3-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand
              ${!email ? 'bg-grey02 text-grey04' : 'bg-purple04 text-white'}`}
          >
            {manualLoading ? (
              <LoadingSpinner className="h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              '인증'
            )}
          </button>
        )}
      </div>

      {/* 에러 메시지 */}
      {errorMessage && <ErrorMessage message={errorMessage} />}

      {/* 인증번호 입력 (모드와 상관없이 emailSent가 true이면 렌더링) */}
      {emailSent && !emailVerified && (
        <div className="relative mt-[15px] max-xl:mt-[13px] max-lg:mt-[10px] max-md:mt-[14px] max-sm:mt-[14px]">
          <AuthInput
            name="verificationCode"
            placeholder="인증번호 입력"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="pr-24"
          />
          <button
            type="button"
            onClick={() => verifyCode(code)}
            className="absolute right-1 top-[31px] h-10 min-w-[68px] rounded-lg bg-brand px-2 text-body-3-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            확인
          </button>
        </div>
      )}

      {/* 로딩 상태: 큰 모달 대신 작은 floating pill */}
      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-[calc(50%_+_var(--itplace-sidebar-width)_/_2)] top-6 z-[10001] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/70 bg-grey07/90 px-4 py-2.5 text-body-3-bold text-white shadow-[0_14px_34px_rgba(16,17,20,0.22)] backdrop-blur-md max-md:left-1/2 max-md:top-auto max-md:bottom-6 max-md:text-body-4-bold"
        >
          <LoadingSpinner className="h-4 w-4 border-2 border-white/70 border-t-transparent" />
          <span>인증 메일 전송 중</span>
        </div>
      )}
    </div>
  );
};

export default EmailVerificationBox;
