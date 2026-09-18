import { useCallback, useEffect, useRef, useState } from 'react';
import { AxiosError, isCancel } from 'axios';
import gsap from 'gsap';
import AuthButton from '../common/AuthButton';
import AuthInput from '../common/AuthInput';
import { showToast } from '../../../../utils/toast';
import {
  confirmSmsVerificationCode,
  issueSmsVerificationCode,
  type SmsVerificationIssueResponse,
} from '../../apis/verification';

type SignUpPhoneVerificationFormProps = {
  initialPhoneNumber?: string;
  onNext: (phoneNumber: string) => void;
};

const normalizePhoneNumber = (value: string) => value.replace(/\D/g, '');
const SIGNUP_SMS_STORAGE_KEY = 'itplace.signupSmsVerification';
const POLL_INTERVAL_MS = 5000;

type VerificationNotice = {
  kind: 'limited' | 'error' | 'expired';
  message: string;
};

const retryDelayMs = (value: unknown) => {
  const seconds = Number(value);
  const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(String(value)) - Date.now();
  return Number.isFinite(delay) ? Math.max(POLL_INTERVAL_MS, delay) : POLL_INTERVAL_MS;
};

type StoredSmsVerification = {
  phoneNumber: string;
  issue: SmsVerificationIssueResponse;
  expiresAt: number;
};

const clearStoredSmsVerification = () => {
  window.sessionStorage.removeItem(SIGNUP_SMS_STORAGE_KEY);
};

const readStoredSmsVerification = (initialPhoneNumber: string): StoredSmsVerification | null => {
  try {
    const stored = window.sessionStorage.getItem(SIGNUP_SMS_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as StoredSmsVerification;
    const hasValidShape =
      parsed.phoneNumber &&
      parsed.issue?.phoneNumber &&
      parsed.issue?.verificationText &&
      parsed.issue?.receiverPhoneNumber &&
      Number.isFinite(parsed.expiresAt);

    if (!hasValidShape || Date.now() > parsed.expiresAt) {
      clearStoredSmsVerification();
      return null;
    }

    if (initialPhoneNumber && normalizePhoneNumber(initialPhoneNumber) !== parsed.phoneNumber) {
      clearStoredSmsVerification();
      return null;
    }

    return parsed;
  } catch {
    clearStoredSmsVerification();
    return null;
  }
};

const storeSmsVerification = (verification: StoredSmsVerification) => {
  window.sessionStorage.setItem(SIGNUP_SMS_STORAGE_KEY, JSON.stringify(verification));
};

const formatSeconds = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const restSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${restSeconds}`;
};

const isMobileSmsEnvironment = () =>
  /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent) ||
  (window.navigator.maxTouchPoints > 1 && /Macintosh/i.test(window.navigator.userAgent));

const openSmsComposer = ({
  receiverPhoneNumber,
  verificationText,
}: SmsVerificationIssueResponse) => {
  if (!isMobileSmsEnvironment()) {
    return false;
  }

  const receiver = receiverPhoneNumber.replace(/\D/g, '') || receiverPhoneNumber;
  const body = encodeURIComponent(verificationText);
  const separator = /iPhone|iPad|iPod/i.test(window.navigator.userAgent) ? '&' : '?';
  window.location.href = `sms:${receiver}${separator}body=${body}`;
  return true;
};

const SignUpPhoneVerificationForm = ({
  initialPhoneNumber = '',
  onNext,
}: SignUpPhoneVerificationFormProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const confirmRequestRef = useRef<AbortController | null>(null);
  const issueRequestRef = useRef<AbortController | null>(null);
  const nextCheckAtRef = useRef(0);
  const pausedRef = useRef(false);
  const completedRef = useRef(false);
  const [storedVerification] = useState(() => readStoredSmsVerification(initialPhoneNumber));
  const [phoneNumber, setPhoneNumber] = useState(
    storedVerification?.phoneNumber ?? normalizePhoneNumber(initialPhoneNumber)
  );
  const [issue, setIssue] = useState<SmsVerificationIssueResponse | null>(
    storedVerification?.issue ?? null
  );
  const [expiresAt, setExpiresAt] = useState<number | null>(storedVerification?.expiresAt ?? null);
  const [now, setNow] = useState(Date.now);
  const [retryAt, setRetryAt] = useState(0);
  const [notice, setNotice] = useState<VerificationNotice | null>(null);
  const [loading, setLoading] = useState(false);

  const abortConfirmation = useCallback(() => {
    confirmRequestRef.current?.abort();
    confirmRequestRef.current = null;
  }, []);

  useEffect(
    () => () => {
      abortConfirmation();
      issueRequestRef.current?.abort();
      issueRequestRef.current = null;
    },
    [abortConfirmation]
  );

  useEffect(() => {
    gsap.fromTo(
      wrapperRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.out' }
    );
  }, []);

  const handlePhoneChange = (value: string) => {
    abortConfirmation();
    setPhoneNumber(normalizePhoneNumber(value).slice(0, 11));
    setIssue(null);
    setExpiresAt(null);
    setRetryAt(0);
    setNotice(null);
    nextCheckAtRef.current = 0;
    pausedRef.current = false;
    completedRef.current = false;
    clearStoredSmsVerification();
  };

  const handleIssueSms = async () => {
    if (issueRequestRef.current) return;
    const normalized = normalizePhoneNumber(phoneNumber);
    if (!/^01\d{8,9}$/.test(normalized)) {
      showToast("휴대폰 번호는 '-' 없이 01012345678 형식으로 입력해주세요.", 'error');
      return;
    }

    const controller = new AbortController();
    issueRequestRef.current = controller;
    try {
      setLoading(true);
      setNotice(null);
      const response = await issueSmsVerificationCode(normalized, controller.signal);
      if (issueRequestRef.current !== controller) return;
      abortConfirmation();
      pausedRef.current = false;
      nextCheckAtRef.current = 0;
      setRetryAt(0);
      setNow(Date.now());
      const nextExpiresAt = Date.now() + response.expiresInSeconds * 1000;
      setIssue(response);
      setPhoneNumber(response.phoneNumber);
      setExpiresAt(nextExpiresAt);
      storeSmsVerification({
        phoneNumber: response.phoneNumber,
        issue: response,
        expiresAt: nextExpiresAt,
      });
      completedRef.current = false;
      if (openSmsComposer(response)) {
        showToast('문자 앱에서 전송 버튼을 누르고 돌아오면 자동으로 인증됩니다.', 'success');
      } else {
        showToast('휴대폰에서 안내된 문자 내용을 전송하면 자동으로 인증됩니다.', 'success');
      }
    } catch (error) {
      if (isCancel(error) || issueRequestRef.current !== controller) return;
      const axiosError = error as AxiosError<{ code?: string; message?: string }>;
      const code = axiosError.response?.data?.code;
      const fallback = axiosError.response?.data?.message || '문자 인증 요청에 실패했습니다.';
      showToast(
        code === 'DUPLICATE_PHONE_NUMBER' ? '이미 가입된 휴대폰 번호입니다.' : fallback,
        'error'
      );
    } finally {
      if (issueRequestRef.current === controller) {
        issueRequestRef.current = null;
        setLoading(false);
      }
    }
  };

  const expireVerification = useCallback(() => {
    abortConfirmation();
    setIssue(null);
    setExpiresAt(null);
    setRetryAt(0);
    pausedRef.current = false;
    clearStoredSmsVerification();
    setNotice({ kind: 'expired', message: '인증 시간이 만료되었습니다. 다시 인증해주세요.' });
  }, [abortConfirmation]);

  const confirmAutomatically = useCallback(async () => {
    if (!issue || completedRef.current) return;

    if (expiresAt && Date.now() >= expiresAt) {
      expireVerification();
      return;
    }

    if (
      document.visibilityState !== 'visible' ||
      pausedRef.current ||
      confirmRequestRef.current ||
      Date.now() < nextCheckAtRef.current
    )
      return;

    const controller = new AbortController();
    confirmRequestRef.current = controller;
    nextCheckAtRef.current = Date.now() + POLL_INTERVAL_MS;
    setRetryAt(0);
    setNotice(null);
    try {
      await confirmSmsVerificationCode(issue.phoneNumber, controller.signal);
      if (confirmRequestRef.current !== controller) return;
      completedRef.current = true;
      clearStoredSmsVerification();
      showToast('휴대폰 인증이 완료되었습니다.', 'success');
      onNext(issue.phoneNumber);
    } catch (error) {
      if (isCancel(error) || confirmRequestRef.current !== controller) return;
      const response = (error as AxiosError<{ code?: string }>).response;
      const code = response?.data?.code;

      if (response?.status === 429) {
        const retryUntil = Date.now() + retryDelayMs(response.headers['retry-after']);
        nextCheckAtRef.current = retryUntil;
        setRetryAt(retryUntil);
        setNotice({
          kind: 'limited',
          message: '확인 요청이 많아 잠시 기다리고 있어요. 잠시 후 자동으로 다시 확인합니다.',
        });
      } else if (code === 'SMS_CODE_EXPIRED') {
        expireVerification();
      } else if (code !== 'SMS_VERIFICATION_FAILURE') {
        pausedRef.current = true;
        setNotice({
          kind: 'error',
          message: response
            ? '문자 인증 서비스에 일시적인 문제가 있어요. 잠시 후 다시 확인해주세요.'
            : '인증 상태를 확인하지 못했어요. 인터넷 연결을 확인하고 다시 시도해주세요.',
        });
      }
    } finally {
      if (confirmRequestRef.current === controller) {
        confirmRequestRef.current = null;
        nextCheckAtRef.current = Math.max(nextCheckAtRef.current, Date.now() + POLL_INTERVAL_MS);
      }
    }
  }, [expireVerification, expiresAt, issue, onNext]);

  useEffect(() => {
    if (!issue || completedRef.current) return;

    const tick = () => {
      setNow(Date.now());
      void confirmAutomatically();
    };
    tick();
    const intervalId = window.setInterval(tick, 1000);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', tick);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [confirmAutomatically, issue]);

  const remainingSeconds = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : 0;
  const retrySeconds = Math.max(0, Math.ceil((retryAt - now) / 1000));
  const canSubmit = /^01\d{8,9}$/.test(normalizePhoneNumber(phoneNumber)) && !loading;

  return (
    <div ref={wrapperRef} className="w-full flex flex-col items-center">
      <div className="mb-6 w-[320px] text-left max-xl:w-[274px] max-lg:w-[205px] max-md:w-full max-sm:w-full">
        <p className="text-body-3 font-semibold text-grey06 max-md:text-body-2">휴대폰 번호</p>
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
        label={
          loading
            ? '인증 준비 중...'
            : retrySeconds > 0
              ? `${retrySeconds}초 후 자동 확인`
              : notice?.kind === 'error'
                ? '인증 다시 확인'
                : issue
                  ? isMobileSmsEnvironment()
                    ? '문자 앱 다시 열기'
                    : '인증 상태 확인'
                  : notice?.kind === 'expired'
                    ? '다시 인증하기'
                    : '문자 인증하기'
        }
        onClick={() => {
          if (issue) {
            if (pausedRef.current) {
              pausedRef.current = false;
              setNotice(null);
            } else {
              openSmsComposer(issue);
            }
            void confirmAutomatically();
            return;
          }
          void handleIssueSms();
        }}
        variant={!loading && retrySeconds === 0 && (canSubmit || issue) ? 'default' : 'disabled'}
      />

      {notice && (
        <p
          role={notice.kind === 'limited' ? 'status' : 'alert'}
          className="mt-3 w-full max-w-[320px] text-body-5 leading-relaxed text-grey06"
        >
          {notice.message}
        </p>
      )}

      {issue && (
        <div className="mt-5 w-[320px] max-xl:w-[274px] max-lg:w-[205px] max-md:w-full max-sm:w-full rounded-[20px] border border-purple02 bg-gradient-to-br from-purple01/60 to-white px-4 py-4 text-left shadow-[0_10px_24px_rgba(113,50,245,0.08)]">
          <p className="text-body-3 font-semibold text-purple05">
            {notice?.kind === 'error'
              ? '인증 확인이 잠시 멈췄어요'
              : notice?.kind === 'limited'
                ? '잠시 후 다시 확인합니다'
                : '문자 전송 후 자동 확인 중'}
          </p>
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
            {notice
              ? '현재 인증 정보는 유효시간 안에 사용할 수 있어요.'
              : '이 화면으로 돌아오면 수신 여부를 자동으로 확인해요.'}
            {remainingSeconds > 0 ? ` 남은 시간 ${formatSeconds(remainingSeconds)}` : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default SignUpPhoneVerificationForm;
