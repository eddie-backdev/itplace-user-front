import { useCallback, useEffect, useRef, useState } from 'react';
import { AxiosError, isCancel } from 'axios';
import AuthButton from '../common/AuthButton';
import AuthInput from '../common/AuthInput';
import { showToast } from '../../../../utils/toast';
import {
  confirmSmsVerificationCode,
  issueSmsVerificationCode,
  type SmsVerificationIssueResponse,
} from '../../apis/verification';

type PhoneVerificationFormProps = {
  userId: number;
  initialPhoneNumber?: string;
  onVerified: () => void | Promise<void>;
};

type StoredVerification = {
  userId: number;
  issuedAt: number;
  phoneNumber: string;
  issue: SmsVerificationIssueResponse;
  expiresAt: number;
};

type VerificationNotice = { kind: 'limited' | 'error' | 'expired'; message: string };

const LEGACY_SIGNUP_KEY = 'itplace.signupSmsVerification';
const getStorageKey = (userId: number) => `itplace.phoneVerification.v1.${userId}`;
const POLL_INTERVAL_MS = 5000;
const MAX_SESSION_AGE_MS = 10 * 60 * 1000;
const normalizePhoneNumber = (value: string) => value.replace(/\D/g, '');

const isPhoneUserAgent = () =>
  typeof navigator !== 'undefined' &&
  /iPhone|iPod|Android.*Mobile|Windows Phone|IEMobile/i.test(navigator.userAgent);

const clearStoredVerification = (userId: number) => {
  window.sessionStorage.removeItem(getStorageKey(userId));
};

const readStoredVerification = (
  userId: number,
  initialPhoneNumber: string
): StoredVerification | null => {
  try {
    const serialized = window.sessionStorage.getItem(getStorageKey(userId));
    if (!serialized) return null;
    const stored = JSON.parse(serialized) as StoredVerification;
    const now = Date.now();
    const valid =
      stored.userId === userId &&
      Number.isFinite(stored.issuedAt) &&
      now >= stored.issuedAt &&
      now - stored.issuedAt <= MAX_SESSION_AGE_MS &&
      Number.isFinite(stored.expiresAt) &&
      stored.expiresAt > now &&
      stored.expiresAt <= stored.issuedAt + MAX_SESSION_AGE_MS &&
      /^01\d{8,9}$/.test(stored.phoneNumber) &&
      stored.issue?.phoneNumber === stored.phoneNumber &&
      /^[A-F0-9]{32}$/.test(stored.issue?.verificationText ?? '') &&
      Boolean(stored.issue?.receiverPhoneNumber);

    if (!valid || (initialPhoneNumber && normalizePhoneNumber(initialPhoneNumber) !== stored.phoneNumber)) {
      clearStoredVerification(userId);
      return null;
    }
    return stored;
  } catch {
    clearStoredVerification(userId);
    return null;
  }
};

const openSmsComposer = (issue: SmsVerificationIssueResponse) => {
  if (!isPhoneUserAgent()) return false;
  const receiver = issue.receiverPhoneNumber.replace(/\D/g, '') || issue.receiverPhoneNumber;
  const separator = /iPhone|iPod/i.test(navigator.userAgent) ? '&' : '?';
  window.location.href = `sms:${receiver}${separator}body=${encodeURIComponent(issue.verificationText)}`;
  return true;
};

const formatSeconds = (seconds: number) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

const retryDelayMs = (value: unknown) => {
  const seconds = Number(value);
  const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(String(value)) - Date.now();
  return Number.isFinite(delay) ? Math.max(POLL_INTERVAL_MS, delay) : POLL_INTERVAL_MS;
};

export default function SignUpPhoneVerificationForm({
  userId,
  initialPhoneNumber = '',
  onVerified,
}: PhoneVerificationFormProps) {
  const confirmRequestRef = useRef<AbortController | null>(null);
  const issueRequestRef = useRef<AbortController | null>(null);
  const nextCheckAtRef = useRef(0);
  const pausedRef = useRef(false);
  const completedRef = useRef(false);
  const noticeRef = useRef<HTMLParagraphElement>(null);
  const [phoneNumber, setPhoneNumber] = useState(normalizePhoneNumber(initialPhoneNumber));
  const [issue, setIssue] = useState<SmsVerificationIssueResponse | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now);
  const [retryAt, setRetryAt] = useState(0);
  const [notice, setNotice] = useState<VerificationNotice | null>(null);
  const [copyNotice, setCopyNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const isPhone = isPhoneUserAgent();

  const abortConfirmation = useCallback(() => {
    confirmRequestRef.current?.abort();
    confirmRequestRef.current = null;
  }, []);

  useEffect(() => {
    window.sessionStorage.removeItem(LEGACY_SIGNUP_KEY);
    return () => {
      abortConfirmation();
      issueRequestRef.current?.abort();
      issueRequestRef.current = null;
    };
  }, [abortConfirmation, userId]);

  useEffect(() => {
    if (!isPhoneUserAgent()) return;
    const stored = readStoredVerification(userId, initialPhoneNumber);
    if (!stored) return;
    setPhoneNumber(stored.phoneNumber);
    setIssue(stored.issue);
    setExpiresAt(stored.expiresAt);
  }, [initialPhoneNumber, userId]);

  useEffect(() => {
    if (notice?.kind === 'error') noticeRef.current?.focus();
  }, [notice]);

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
    clearStoredVerification(userId);
  };

  const handleIssueSms = async () => {
    if (!isPhone || issueRequestRef.current) return;
    const normalized = normalizePhoneNumber(phoneNumber);
    if (!/^01\d{8,9}$/.test(normalized)) {
      setNotice({ kind: 'error', message: "휴대폰 번호를 01012345678 형식으로 입력해주세요." });
      return;
    }

    const controller = new AbortController();
    issueRequestRef.current = controller;
    try {
      setLoading(true);
      setNotice(null);
      const response = await issueSmsVerificationCode(normalized, controller.signal);
      if (issueRequestRef.current !== controller) return;
      if (
        response.phoneNumber !== normalized ||
        !/^[A-F0-9]{32}$/.test(response.verificationText) ||
        !response.receiverPhoneNumber ||
        !Number.isFinite(response.expiresInSeconds) ||
        response.expiresInSeconds <= 0 ||
        response.expiresInSeconds * 1000 > MAX_SESSION_AGE_MS
      ) {
        setNotice({ kind: 'error', message: '인증 문자를 준비하지 못했어요. 다시 시도해주세요.' });
        return;
      }

      abortConfirmation();
      pausedRef.current = false;
      nextCheckAtRef.current = 0;
      setRetryAt(0);
      const issuedAt = Date.now();
      const nextExpiresAt = issuedAt + response.expiresInSeconds * 1000;
      const next: StoredVerification = {
        userId,
        issuedAt,
        phoneNumber: response.phoneNumber,
        issue: response,
        expiresAt: nextExpiresAt,
      };
      setNow(issuedAt);
      setIssue(response);
      setPhoneNumber(response.phoneNumber);
      setExpiresAt(nextExpiresAt);
      window.sessionStorage.setItem(getStorageKey(userId), JSON.stringify(next));
      completedRef.current = false;
      openSmsComposer(response);
      showToast('문자 앱에서 전송한 뒤 이 화면으로 돌아오면 자동으로 확인됩니다.', 'success');
    } catch (error) {
      if (isCancel(error) || issueRequestRef.current !== controller) return;
      const axiosError = error as AxiosError<{ code?: string }>;
      const code = axiosError.response?.data?.code;
      const message =
        code === 'DUPLICATE_PHONE_NUMBER' ||
        code === 'PHONE_NUMBER_ALREADY_EXISTS' ||
        axiosError.response?.status === 409
          ? '이미 다른 계정에서 인증한 휴대폰 번호예요.'
          : '문자 인증을 시작하지 못했어요. 연결 상태를 확인하고 다시 시도해주세요.';
      setNotice({ kind: 'error', message });
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
    clearStoredVerification(userId);
    setNotice({ kind: 'expired', message: '인증 시간이 만료되었습니다. 다시 시작해주세요.' });
  }, [abortConfirmation, userId]);

  const confirmAutomatically = useCallback(async () => {
    if (!isPhoneUserAgent() || !issue || completedRef.current) return;
    if (expiresAt && Date.now() >= expiresAt) {
      expireVerification();
      return;
    }
    if (
      document.visibilityState !== 'visible' ||
      pausedRef.current ||
      confirmRequestRef.current ||
      Date.now() < nextCheckAtRef.current
    ) return;

    const controller = new AbortController();
    confirmRequestRef.current = controller;
    nextCheckAtRef.current = Date.now() + POLL_INTERVAL_MS;
    setRetryAt(0);
    setNotice(null);
    try {
      await confirmSmsVerificationCode(issue.phoneNumber, issue.verificationText, controller.signal);
      if (confirmRequestRef.current !== controller) return;
      completedRef.current = true;
      clearStoredVerification(userId);
      showToast('휴대폰 인증이 완료되었습니다.', 'success');
      await onVerified();
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
          message: '확인 요청이 많아 잠시 기다린 뒤 자동으로 다시 확인합니다.',
        });
      } else if (code === 'SMS_CODE_EXPIRED') {
        expireVerification();
      } else if (code === 'DUPLICATE_PHONE_NUMBER' || code === 'PHONE_NUMBER_ALREADY_EXISTS') {
        pausedRef.current = true;
        setNotice({ kind: 'error', message: '이미 다른 계정에서 인증한 휴대폰 번호예요.' });
      } else if (code !== 'SMS_VERIFICATION_FAILURE') {
        pausedRef.current = true;
        setNotice({
          kind: 'error',
          message: response
            ? '인증 상태를 확인하지 못했어요. 잠시 후 다시 시도해주세요.'
            : '네트워크 연결을 확인하고 인증 상태를 다시 확인해주세요.',
        });
      }
    } finally {
      if (confirmRequestRef.current === controller) {
        confirmRequestRef.current = null;
        nextCheckAtRef.current = Math.max(nextCheckAtRef.current, Date.now() + POLL_INTERVAL_MS);
      }
    }
  }, [expireVerification, expiresAt, issue, onVerified, userId]);

  useEffect(() => {
    if (!issue || completedRef.current) return;
    const tick = () => {
      setNow(Date.now());
      void confirmAutomatically();
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', tick);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [confirmAutomatically, issue]);

  const copyCurrentPageAddress = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}`);
      setCopyNotice('내 정보 페이지 주소를 복사했어요. 휴대폰에서 열어 인증을 진행해주세요.');
    } catch {
      setCopyNotice('주소를 복사하지 못했어요. 휴대폰에서 내 정보 페이지를 열어주세요.');
    }
  };

  const remainingSeconds = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : 0;
  const retrySeconds = Math.max(0, Math.ceil((retryAt - now) / 1000));
  const canSubmit = /^01\d{8,9}$/.test(normalizePhoneNumber(phoneNumber)) && !loading;

  return (
    <div className="w-full">
      {!isPhone ? (
        <div className="w-full text-left">
          <p className="text-sm leading-6 text-grey06">
            휴대폰에서 로그인한 뒤 회원 정보에서 휴대폰 번호 인증을 진행해 주세요.
          </p>
          <button
            type="button"
            onClick={copyCurrentPageAddress}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-warmBorder px-4 text-sm font-semibold text-ink hover:bg-warmCanvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            이 페이지 주소 복사
          </button>
          <p className="mt-3 min-h-5 text-sm text-grey05" role="status" aria-live="polite">
            {copyNotice}
          </p>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center">
          <div className="mb-4 flex w-full justify-center">
            <AuthInput
              name="phoneNumber"
              label="휴대폰 번호"
              type="tel"
              placeholder="휴대폰 번호 01012345678"
              value={phoneNumber}
              onChange={(event) => handlePhoneChange(event.target.value)}
              disabled={loading || Boolean(issue) || Boolean(initialPhoneNumber)}
            />
          </div>
          <AuthButton
            label={
              loading
                ? '인증 준비 중…'
                : retrySeconds > 0
                  ? `${retrySeconds}초 후 자동 확인`
                  : issue
                    ? pausedRef.current
                      ? '인증 다시 확인'
                      : '문자 앱 다시 열기'
                    : notice?.kind === 'expired'
                      ? '다시 인증하기'
                      : '문자 인증하기'
            }
            onClick={() => {
              if (!issue) {
                void handleIssueSms();
                return;
              }
              if (pausedRef.current) {
                pausedRef.current = false;
                setNotice(null);
              } else {
                openSmsComposer(issue);
              }
              void confirmAutomatically();
            }}
            variant={!loading && retrySeconds === 0 && (canSubmit || Boolean(issue)) ? 'default' : 'disabled'}
          />
          {notice && (
            <p
              ref={noticeRef}
              role={notice.kind === 'limited' ? 'status' : 'alert'}
              aria-live={notice.kind === 'limited' ? 'polite' : 'assertive'}
              tabIndex={notice.kind === 'error' ? -1 : undefined}
              className="mt-3 w-full max-w-[320px] text-sm leading-relaxed text-grey06"
            >
              {notice.message}
            </p>
          )}
          {issue && (
            <section className="mt-5 w-full rounded-2xl border border-warmBorder bg-grey01 px-4 py-4 text-left">
              <h3 className="text-sm font-semibold text-grey06">
                {notice?.kind === 'error'
                  ? '인증 확인을 다시 시작할 수 있어요'
                  : notice?.kind === 'limited'
                    ? '잠시 후 자동으로 다시 확인합니다'
                    : '문자 앱에서 본인 확인 중'}
              </h3>
              <p className="mt-2 text-sm leading-6 text-grey05">
                문자 앱에서 전송한 뒤 이 화면으로 돌아오면 자동으로 확인해요. 인증 문구를 직접 입력할 필요는 없습니다.
              </p>
              <p className="mt-3 text-xs leading-5 text-grey04">
                {notice ? '유효시간 안에 인증을 다시 진행할 수 있어요.' : '이 화면으로 돌아오면 수신 여부를 확인합니다.'}
                {remainingSeconds > 0 ? ` 남은 시간 ${formatSeconds(remainingSeconds)}` : ''}
              </p>
              {!initialPhoneNumber && (
                <button
                  type="button"
                  onClick={() => handlePhoneChange('')}
                  className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg border border-warmBorder px-3 text-sm font-semibold text-grey06 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  다른 번호로 인증
                </button>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
