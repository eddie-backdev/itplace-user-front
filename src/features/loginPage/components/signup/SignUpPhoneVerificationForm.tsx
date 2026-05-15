import { useCallback, useEffect, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import gsap from 'gsap';
import AuthButton from '../common/AuthButton';
import AuthFooter from '../common/AuthFooter';
import AuthInput from '../common/AuthInput';
import { showToast } from '../../../../utils/toast';
import {
  confirmSmsVerificationCode,
  issueSmsVerificationCode,
  type SmsVerificationIssueResponse,
} from '../../apis/verification';

type SignUpPhoneVerificationFormProps = {
  initialPhoneNumber?: string;
  onGoToLogin: () => void;
  onNext: (phoneNumber: string) => void;
};

const normalizePhoneNumber = (value: string) => value.replace(/\D/g, '');

const formatSeconds = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const restSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${restSeconds}`;
};

const openSmsComposer = ({
  receiverPhoneNumber,
  verificationText,
}: SmsVerificationIssueResponse) => {
  const body = encodeURIComponent(verificationText);
  const separator = /iPhone|iPad|iPod/i.test(window.navigator.userAgent) ? '&' : '?';
  window.location.href = `sms:${receiverPhoneNumber}${separator}body=${body}`;
};

const SignUpPhoneVerificationForm = ({
  initialPhoneNumber = '',
  onGoToLogin,
  onNext,
}: SignUpPhoneVerificationFormProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const checkingRef = useRef(false);
  const completedRef = useRef(false);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [issue, setIssue] = useState<SmsVerificationIssueResponse | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [autoChecking, setAutoChecking] = useState(false);

  useEffect(() => {
    gsap.fromTo(
      wrapperRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.out' }
    );
  }, []);

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(normalizePhoneNumber(value).slice(0, 11));
    setIssue(null);
    setExpiresAt(null);
    setRemainingSeconds(0);
    completedRef.current = false;
  };

  const handleIssueSms = async () => {
    const normalized = normalizePhoneNumber(phoneNumber);
    if (!/^01\d{8,9}$/.test(normalized)) {
      showToast("휴대폰 번호는 '-' 없이 01012345678 형식으로 입력해주세요.", 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await issueSmsVerificationCode(normalized);
      setIssue(response);
      setPhoneNumber(response.phoneNumber);
      setExpiresAt(Date.now() + response.expiresInSeconds * 1000);
      completedRef.current = false;
      showToast('문자 앱에서 전송 버튼을 누르고 돌아오면 자동으로 인증됩니다.', 'success');
      openSmsComposer(response);
    } catch (error) {
      const axiosError = error as AxiosError<{ code?: string; message?: string }>;
      const code = axiosError.response?.data?.code;
      const fallback = axiosError.response?.data?.message || '문자 인증 요청에 실패했습니다.';
      showToast(
        code === 'DUPLICATE_PHONE_NUMBER' ? '이미 가입된 휴대폰 번호입니다.' : fallback,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmAutomatically = useCallback(async () => {
    if (!issue || completedRef.current || checkingRef.current) return;

    if (expiresAt && Date.now() > expiresAt) {
      setIssue(null);
      setExpiresAt(null);
      setRemainingSeconds(0);
      setAutoChecking(false);
      showToast('문자 인증 시간이 만료되었습니다. 다시 인증해주세요.', 'error');
      return;
    }

    checkingRef.current = true;
    setAutoChecking(true);
    try {
      await confirmSmsVerificationCode(issue.phoneNumber);
      completedRef.current = true;
      showToast('휴대폰 인증이 완료되었습니다.', 'success');
      onNext(issue.phoneNumber);
    } catch {
      // Octomo에 수신 문자가 아직 반영되지 않은 정상 대기 상태입니다.
    } finally {
      checkingRef.current = false;
      setAutoChecking(false);
    }
  }, [expiresAt, issue, onNext]);

  useEffect(() => {
    if (!issue || completedRef.current) return;

    void confirmAutomatically();
    const intervalId = window.setInterval(() => {
      void confirmAutomatically();
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [confirmAutomatically, issue]);

  useEffect(() => {
    if (!issue || completedRef.current) return;

    const handleFocus = () => {
      void confirmAutomatically();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void confirmAutomatically();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [confirmAutomatically, issue]);

  useEffect(() => {
    if (!expiresAt || completedRef.current) return;

    const updateRemaining = () => {
      setRemainingSeconds(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    };

    updateRemaining();
    const intervalId = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(intervalId);
  }, [expiresAt]);

  const canSubmit = /^01\d{8,9}$/.test(normalizePhoneNumber(phoneNumber)) && !loading;

  return (
    <div ref={wrapperRef} className="w-full flex flex-col items-center">
      <div className="w-[320px] max-xl:w-[274px] max-lg:w-[205px] max-md:w-full max-sm:w-full text-left mb-[51px] max-xl:mb-[44px] max-lg:mb-[34px] max-md:mb-[36px] max-sm:mb-[36px]">
        <p className="text-title-4 max-xl:text-title-5 max-lg:text-title-6 max-md:text-title-5 max-sm:text-title-5">
          먼저 <span className="font-semibold">휴대폰 인증</span>을 진행해주세요
        </p>
        <p className="mt-3 text-body-4 text-grey04 leading-relaxed">
          본인 휴대폰에서 안내 문자를 전송하면 인증 완료 후 가입 정보 입력 화면으로 이동합니다.
        </p>
      </div>

      <div className="mb-[16px] w-full flex justify-center">
        <AuthInput
          name="phoneNumber"
          type="tel"
          placeholder="휴대폰 번호 01012345678"
          value={phoneNumber}
          onChange={(event) => handlePhoneChange(event.target.value)}
          disabled={loading || Boolean(issue)}
        />
      </div>

      <AuthButton
        label={loading ? '인증 준비 중...' : issue ? '문자 앱 다시 열기' : '문자 인증하기'}
        onClick={() => {
          if (issue) {
            openSmsComposer(issue);
            void confirmAutomatically();
            return;
          }
          void handleIssueSms();
        }}
        variant={canSubmit || issue ? 'default' : 'disabled'}
      />

      {issue && (
        <div className="mt-5 w-[320px] max-xl:w-[274px] max-lg:w-[205px] max-md:w-full max-sm:w-full rounded-[18px] border border-purple02 bg-purple01/40 px-4 py-4 text-left">
          <p className="text-body-3 font-semibold text-purple05">문자 전송 후 자동 확인 중</p>
          <p className="mt-2 text-body-5 text-grey05 leading-relaxed">
            모바일 웹에서는 문자 앱이 열립니다. 데스크톱에서는 본인 휴대폰에서 아래 내용을 그대로
            전송해주세요.
          </p>
          <div className="mt-3 rounded-[14px] bg-white px-3 py-3 text-body-5 text-grey05">
            <p>
              <span className="font-semibold text-grey06">받는 번호</span>{' '}
              {issue.receiverPhoneNumber}
            </p>
            <p className="mt-2 break-all">
              <span className="font-semibold text-grey06">문자 본문</span> {issue.verificationText}
            </p>
          </div>
          <p className="mt-3 text-body-5 text-grey04">
            {autoChecking ? '수신 여부를 확인하고 있어요.' : '문자 전송 후 잠시 기다려주세요.'}
            {remainingSeconds > 0 ? ` 남은 시간 ${formatSeconds(remainingSeconds)}` : ''}
          </p>
        </div>
      )}

      <AuthFooter
        leftText="이미 회원이신가요?"
        rightText="로그인 하러 가기"
        onRightClick={onGoToLogin}
      />
    </div>
  );
};

export default SignUpPhoneVerificationForm;
