import { useState, useEffect, useCallback, useRef } from 'react';
import { MdClose } from 'react-icons/md';
import { Link, useNavigate, useSearchParams } from '@/lib/navigation';
import { AxiosError } from 'axios';
import { showToast } from '../../../utils/toast';
import LoginForm from '../components/login/LoginForm';
import FindPasswordForm from '../components/find/FindPasswordForm';
import OAuthIntegrationForm from '../components/signup/OAuthIntegrationForm';
import OAuthAccountLinkForm from '../components/signup/OAuthAccountLinkForm';
import SignUpAccountForm from '../components/signup/SignUpAccountForm';
import SignUpFinalForm from '../components/signup/SignUpFinalForm';
import SignupComplete from '../components/signup/SignupComplete';
import { oauthLink, oauthSignUp } from '../apis/user';
import { getOAuthResult } from '../apis/auth';
import { AuthTransition } from '../hooks/AuthTransition';
import { useDispatch } from 'react-redux';
import { setLoginSuccess } from '../../../store/authSlice';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { consumeOAuthPreAuth } from '../utils/oauthPreAuthStorage';
import {
  clearLoginNavigation,
  consumeLoginIntent,
  consumeOAuthReturnTo,
  getLoginIntent,
  getSafeReturnTo,
  migrateLoginIntent,
  readLoginReturnTo,
  readOAuthReturnTo,
} from '../utils/returnTo.mjs';
import AuthBenefitsPreview, {
  type AuthPreviewPartner,
} from '../components/common/AuthBenefitsPreview';
import SignupFlowHeader from './SignupFlowHeader';
import styles from './AuthPageLayout.module.css';

const emptyLocalSignupData = {
  emailVerified: false,
  nickname: '',
  birthday: '',
  gender: '',
  carrier: '',
  membershipGradeCode: '',
  email: '',
  password: '',
  passwordConfirm: '',
};

const emptyOAuthUserData = {
  nickname: '',
  email: '',
  birthday: '',
  gender: '',
  carrier: '',
  membershipGradeCode: '',
};

const showLoginRequiredToast = () =>
  showToast('로그인이 필요합니다.', 'info', {
    autoClose: 3000,
    pauseOnHover: false,
    pauseOnFocusLoss: false,
    closeButton: ({ closeToast }) => (
      <button
        type="button"
        className="Toastify__close-button"
        aria-label="알림 닫기"
        onClick={(event) => {
          event.stopPropagation();
          closeToast(true);
        }}
      >
        <MdClose aria-hidden="true" />
      </button>
    ),
    role: 'status',
    toastId: 'saved-benefits-login-required',
    position: 'top-right',
  });

const AuthLayout = ({ previewPartners }: { previewPartners: AuthPreviewPartner[] }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    formStep,
    setFormStep,
    goToLogin,
    goToSignUp,
    goToSignUpFinal,
    goToFindPassword,
    goToFindId,
  } = AuthTransition();

  const [searchParams] = useSearchParams();
  const [signUpData, setSignUpData] = useState(emptyLocalSignupData);
  const [oauthUserData, setOAuthUserData] = useState(emptyOAuthUserData);
  const [oauthLinkEmail, setOAuthLinkEmail] = useState('');
  const [signupCompletionMethod, setSignupCompletionMethod] = useState<'local' | 'oauth' | null>(
    null
  );
  const [isOAuthLinking, setIsOAuthLinking] = useState(false);
  const [isOAuthProcessing, setIsOAuthProcessing] = useState(false);
  const hasInitialized = useRef(false);
  const [returnTo, setReturnTo] = useState(() =>
    getSafeReturnTo(searchParams.get('returnTo') ?? readOAuthReturnTo(readLoginReturnTo()))
  );
  const isSignupFlow =
    formStep === 'signUpAccount' ||
    formStep === 'signUpFinal' ||
    formStep === 'signUpComplete' ||
    formStep === 'oauthIntegration' ||
    formStep === 'oauthLink';

  const checkOAuthResult = useCallback(async () => {
    try {
      const [response] = await Promise.all([
        getOAuthResult(),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);

      const { code, data } = response.data;

      if (code === 'OAUTH_INFO_FOUND') {
        if (data) {
          dispatch(
            setLoginSuccess({
              nickname: data.nickname,
              carrier: data.carrier ?? null,
              membershipGrade: data.membershipGradeCode || data.membershipGrade || null,
              membershipGradeCode: data.membershipGradeCode || data.membershipGrade || null,
              membershipVerified: data.membershipVerified ?? false,
            })
          );
        }

        showToast('로그인에 성공하셨습니다!', 'success');
        navigate(consumeOAuthReturnTo(returnTo), { replace: true });
      } else if (code === 'PRE_AUTHENTICATION_SUCCESS') {
        const params = new URLSearchParams({
          step: 'oauthIntegration',
          verifiedType: 'oauth',
        });
        navigate(`/login?${params.toString()}`, { replace: true });
        setFormStep('oauthIntegration');
      } else {
        showToast('로그인에 실패했습니다.', 'error');
        navigate('/login', { replace: true, preserveLoginIntent: true });
      }
    } catch {
      showToast('로그인에 실패했습니다.', 'error');
      navigate('/login', { replace: true, preserveLoginIntent: true });
    } finally {
      setIsOAuthProcessing(false);
    }
  }, [dispatch, navigate, returnTo, setFormStep]);

  useEffect(() => {
    const step = searchParams.get('step');
    const verifiedType = searchParams.get('verifiedType');
    const oauth = searchParams.get('oauth');

    if (oauth === 'processing' && !isOAuthProcessing) {
      setIsOAuthProcessing(true);
      checkOAuthResult();
      return;
    }

    if (hasInitialized.current) return;

    if (step === 'oauthIntegration' && verifiedType === 'oauth') {
      const preAuthData = consumeOAuthPreAuth();
      setOAuthUserData({
        nickname: preAuthData?.nickname ?? '',
        email: preAuthData?.email ?? '',
        birthday: '',
        gender: '',
        carrier: '',
        membershipGradeCode: '',
      });
      setFormStep('oauthIntegration');
      hasInitialized.current = true;
    }
  }, [searchParams, setFormStep, checkOAuthResult, isOAuthProcessing]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const legacyReturnTo = params.get('returnTo');
    const legacyReset = params.get('reset') === '1';
    const legacyNotice = params.get('notice') === 'login-required';
    const storedIntent = getLoginIntent();
    if (legacyReturnTo !== null || legacyReset || legacyNotice) {
      migrateLoginIntent(legacyReturnTo ?? returnTo, {
        reset: legacyReset || storedIntent?.reset,
        notice: legacyNotice || storedIntent?.notice,
      });
      setReturnTo(getSafeReturnTo(legacyReturnTo ?? returnTo));
    }
    const intent = consumeLoginIntent();
    const shouldReset = legacyReset || intent?.reset === true;
    const requiresLogin = legacyNotice || intent?.notice === true;

    if (shouldReset || requiresLogin) {
      if (shouldReset) setFormStep('login');
      if (requiresLogin) showLoginRequiredToast();
    }

    if (legacyReturnTo !== null || legacyReset || legacyNotice) {
      params.delete('returnTo');
      params.delete('reset');
      params.delete('notice');
      const query = params.toString();
      window.history.replaceState(null, '', `/login${query ? `?${query}` : ''}`);
    }
  }, [returnTo, searchParams, setFormStep]);

  useEffect(() => {
    const handleIntent = () => {
      const intent = consumeLoginIntent();
      setReturnTo(readOAuthReturnTo(readLoginReturnTo()));
      if (intent?.reset) setFormStep('login');
      if (intent?.notice) showLoginRequiredToast();
    };
    window.addEventListener('itplace:login-intent', handleIntent);
    return () => window.removeEventListener('itplace:login-intent', handleIntent);
  }, [setFormStep]);

  const handleOAuthSignup = async ({
    nickname,
    email,
    birthday,
    gender,
    carrier,
    membershipGradeCode,
  }: {
    nickname: string;
    email: string;
    birthday: string;
    gender: string;
    carrier: string | null;
    membershipGradeCode: string | null;
  }) => {
    try {
      const response = await oauthSignUp({
        nickname,
        gender,
        birthday,
        carrier,
        membershipGradeCode,
      });
      const data = response.data.data;

      if (data) {
        dispatch(
          setLoginSuccess({
            nickname: data.nickname,
            carrier: data.carrier ?? null,
            membershipGrade: data.membershipGradeCode || data.membershipGrade || null,
            membershipGradeCode: data.membershipGradeCode || data.membershipGrade || null,
            membershipVerified: data.membershipVerified ?? false,
          })
        );
      }

      setOAuthUserData(emptyOAuthUserData);
      clearLoginNavigation();
      setSignupCompletionMethod('oauth');
      setFormStep('signUpComplete');
    } catch (error) {
      const axiosError = error as AxiosError<{ code?: string; message?: string }>;

      if (axiosError.response?.data?.code === 'DUPLICATE_EMAIL') {
        setOAuthLinkEmail(email);
        setFormStep('oauthLink');
        showToast('이미 동일한 이메일로 가입된 계정이 있습니다.', 'info');
        return;
      }

      const msg =
        axiosError.response?.data?.message || '회원가입에 실패했습니다. 다시 시도해주세요.';

      showToast(msg, 'error');
    }
  };

  const handleOAuthLink = async (password: string) => {
    if (!oauthLinkEmail || !password.trim()) {
      showToast('기존 계정 비밀번호를 입력해주세요.', 'error');
      return;
    }

    try {
      setIsOAuthLinking(true);
      const response = await oauthLink({ email: oauthLinkEmail, password });
      const data = response.data.data;

      if (data) {
        dispatch(
          setLoginSuccess({
            nickname: data.nickname,
            carrier: data.carrier ?? null,
            membershipGrade: data.membershipGradeCode || data.membershipGrade || null,
            membershipGradeCode: data.membershipGradeCode || data.membershipGrade || null,
            membershipVerified: data.membershipVerified ?? false,
          })
        );
      }

      showToast('카카오 계정이 기존 계정에 연동되었습니다.', 'success');
      clearLoginNavigation();
      navigate(returnTo, { replace: true });
    } catch (error) {
      const axiosError = error as AxiosError<{ code?: string; message?: string }>;
      const code = axiosError.response?.data?.code;

      if (code === 'UNAUTHORIZED_ACCESS' || code === 'PASSWORD_MISMATCH') {
        showToast('비밀번호가 일치하지 않습니다.', 'error');
        return;
      }

      showToast(
        axiosError.response?.data?.message || '계정 연동에 실패했습니다. 다시 시도해주세요.',
        'error'
      );
    } finally {
      setIsOAuthLinking(false);
    }
  };

  useEffect(() => {
    if (isSignupFlow || isOAuthProcessing) {
      window.scrollTo(0, 0);
    }
    if (isSignupFlow) {
      document.getElementById('signup-flow-heading')?.focus({ preventScroll: true });
    }
  }, [formStep, isOAuthProcessing, isSignupFlow]);

  const signupHeadings: Record<string, string> = {
    signUpAccount: '계정 정보',
    signUpFinal: '회원 정보',
    signUpComplete: '가입 완료',
    oauthIntegration: '회원 정보',
    oauthLink: '기존 계정을 연결하세요',
  };

  const signupDescriptions: Record<string, string> = {
    signUpAccount: '로그인에 사용할 이메일을 인증해 주세요.',
    oauthIntegration: '카카오 계정으로 확인된 정보를 바탕으로 가입합니다.',
    oauthLink: '기존 계정을 확인하면 카카오 로그인과 함께 사용할 수 있어요.',
  };
  const signupStep =
    formStep === 'signUpAccount'
      ? 1
      : formStep === 'signUpFinal' || formStep === 'oauthIntegration'
        ? 2
        : formStep === 'signUpComplete'
          ? 3
          : null;
  const handleLocalSignupComplete = () => {
    setSignUpData(emptyLocalSignupData);
    setSignupCompletionMethod('local');
    setFormStep('signUpComplete');
  };
  const goToPreviousSignupStep = () => {
    if (formStep === 'signUpFinal') setFormStep('signUpAccount');
  };

  const renderFormContent = () => (
    <>
      {isSignupFlow && (
        <SignupFlowHeader
          step={signupStep}
          heading={signupHeadings[formStep]}
          description={signupDescriptions[formStep]}
          onBack={formStep === 'signUpFinal' ? goToPreviousSignupStep : undefined}
        />
      )}
      {formStep === 'login' && (
        <LoginForm
          returnTo={returnTo}
          onGoToFindId={goToFindId}
          onGoToSignUp={() => {
            setSignUpData(emptyLocalSignupData);
            goToSignUp();
          }}
          onGoToFindPassword={goToFindPassword}
        />
      )}

      {formStep === 'signUpAccount' && (
        <SignUpAccountForm
          initialEmail={signUpData.email}
          initialPassword={signUpData.password}
          initialPasswordConfirm={signUpData.passwordConfirm}
          initialEmailVerified={signUpData.emailVerified}
          onValuesChange={(accountData) =>
            setSignUpData((previous) => ({ ...previous, ...accountData }))
          }
          onEmailVerifiedChange={(emailVerified) =>
            setSignUpData((previous) => ({ ...previous, emailVerified }))
          }
          onNext={(accountData) => {
            setSignUpData((previous) => ({ ...previous, ...accountData }));
            goToSignUpFinal();
          }}
        />
      )}

      {formStep === 'signUpFinal' && (
        <SignUpFinalForm
          onComplete={handleLocalSignupComplete}
          onEmailVerificationExpired={() => {
            setSignUpData((previous) => ({ ...previous, emailVerified: false }));
            setFormStep('signUpAccount');
          }}
          onValuesChange={(profileData) =>
            setSignUpData((previous) => ({ ...previous, ...profileData }))
          }
          email={signUpData.email}
          password={signUpData.password}
          passwordConfirm={signUpData.passwordConfirm}
          initialNickname={signUpData.nickname}
          initialBirthday={signUpData.birthday}
          initialGender={signUpData.gender}
          initialCarrier={signUpData.carrier}
          initialMembershipGradeCode={signUpData.membershipGradeCode}
        />
      )}

      {formStep === 'signUpComplete' && (
        <SignupComplete
          isLoggedIn={signupCompletionMethod === 'oauth'}
          continuationLabel="계속하기"
          onContinue={() => {
            if (signupCompletionMethod === 'oauth') {
              navigate(returnTo, { replace: true });
              return;
            }

            goToLogin();
          }}
        />
      )}

      {formStep === 'oauthIntegration' && (
        <OAuthIntegrationForm
          nickname={oauthUserData.nickname}
          email={oauthUserData.email}
          birthday={oauthUserData.birthday}
          gender={oauthUserData.gender}
          carrier={oauthUserData.carrier}
          membershipGradeCode={oauthUserData.membershipGradeCode}
          onNext={handleOAuthSignup}
        />
      )}

      {formStep === 'oauthLink' && (
        <OAuthAccountLinkForm
          email={oauthLinkEmail}
          loading={isOAuthLinking}
          onLink={handleOAuthLink}
          onBack={() => {
            setOAuthLinkEmail('');
            goToLogin();
          }}
        />
      )}

      {formStep === 'findPassword' && <FindPasswordForm onGoToLogin={goToLogin} />}
      {formStep === 'findId' && (
        <section className="text-left" aria-labelledby="find-id-title">
          <h1
            id="find-id-title"
            className="text-[30px] font-bold leading-9 tracking-[-0.04em] text-[#202124]"
          >
            아이디 찾기
          </h1>
          <p className="mt-4 break-keep text-[15px] leading-7 text-[#686b73]">
            잇플레이스 로그인 아이디는 가입할 때 사용한 이메일 주소예요. 가입 이메일 조회는 지원하지
            않으니 받은 메일함을 확인하거나 문의해 주세요.
          </p>
          <Link
            to="/contact"
            className="mt-4 inline-flex min-h-11 items-center font-semibold text-[#6154d9] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154d9]"
          >
            문의하기
          </Link>
          <button
            type="button"
            onClick={goToLogin}
            className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl border border-[#e8e9ee] font-semibold text-[#34343b] hover:bg-[#f7f8fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154d9]"
          >
            로그인으로 돌아가기
          </button>
        </section>
      )}
    </>
  );

  if (isOAuthProcessing) {
    return (
      <div className={styles.page}>
        <div className={styles.processing}>
          <LoadingSpinner />
          <h1 className="mt-5 text-title-6 font-bold text-grey07">카카오 로그인 처리 중입니다</h1>
          <p className="mt-2 text-body-3 leading-6 text-grey05">
            계정 정보를 확인하고 있어요. 잠시만 기다려 주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.page} ${isSignupFlow ? styles.signupPage : ''}`}>
      <div className={`${styles.surface} ${isSignupFlow ? styles.signupSurface : ''}`}>
        <div className={styles.preview}>
          <AuthBenefitsPreview partners={previewPartners} />
        </div>
        <div className={styles.formSide}>
          <section className={`${styles.formCard} ${isSignupFlow ? styles.signupCard : ''}`}>
            {renderFormContent()}
          </section>
          <Link to="/benefits" className={styles.desktopBenefitsLink}>
            혜택 먼저 둘러보기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
