import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Link, useNavigate, useSearchParams } from '@/lib/navigation';
import { AxiosError } from 'axios';
import { showToast } from '../../../utils/toast';
import LoginForm from '../components/login/LoginForm';
import FindPasswordForm from '../components/find/FindPasswordForm';
import OAuthIntegrationForm from '../components/signup/OAuthIntegrationForm';
import OAuthAccountLinkForm from '../components/signup/OAuthAccountLinkForm';
import SignUpAccountForm from '../components/signup/SignUpAccountForm';
import SignUpFinalForm from '../components/signup/SignUpFinalForm';
import { oauthLink, oauthSignUp } from '../apis/user';
import { getOAuthResult } from '../apis/auth';
import { AuthTransition } from '../hooks/AuthTransition';
import { useDispatch } from 'react-redux';
import { setLoginSuccess } from '../../../store/authSlice';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { consumeOAuthPreAuth } from '../utils/oauthPreAuthStorage';
import { clearOAuthReturnTo, consumeOAuthReturnTo, getSafeReturnTo } from '../utils/returnTo.mjs';
import AuthBenefitsPreview, { type AuthPreviewPartner } from '../components/common/AuthBenefitsPreview';
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
  } = AuthTransition();

  const [searchParams] = useSearchParams();
  const [signUpData, setSignUpData] = useState(emptyLocalSignupData);
  const [oauthUserData, setOAuthUserData] = useState(emptyOAuthUserData);
  const [oauthLinkEmail, setOAuthLinkEmail] = useState('');
  const [isOAuthLinking, setIsOAuthLinking] = useState(false);
  const [isOAuthProcessing, setIsOAuthProcessing] = useState(false);
  const hasInitialized = useRef(false);
  const returnTo = getSafeReturnTo(searchParams.get('returnTo'));
  const isSignupFlow =
    formStep === 'signUpAccount' ||
    formStep === 'signUpFinal' ||
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
              membershipGrade: data.membershipGradeCode || data.membershipGrade || 'NORMAL',
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
          returnTo: consumeOAuthReturnTo(returnTo),
        });
        navigate(`/login?${params.toString()}`, { replace: true });
        setFormStep('oauthIntegration');
      } else {
        clearOAuthReturnTo();
        showToast('로그인에 실패했습니다.', 'error');
        navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
      }
    } catch {
      clearOAuthReturnTo();
      showToast('로그인에 실패했습니다.', 'error');
      navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
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
    if (searchParams.get('reset') === '1') {
      setFormStep('login');
      navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
    }
  }, [navigate, returnTo, searchParams, setFormStep]);

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
    carrier: string;
    membershipGradeCode: string;
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
            membershipGrade: data.membershipGradeCode || data.membershipGrade || 'NORMAL',
            membershipGradeCode: data.membershipGradeCode || data.membershipGrade || null,
            membershipVerified: data.membershipVerified ?? false,
          })
        );
      }

      showToast('회원가입이 완료되었습니다.', 'success');
      setOAuthUserData(emptyOAuthUserData);
      clearOAuthReturnTo();
      navigate(returnTo, { replace: true });
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
            membershipGrade: data.membershipGradeCode || data.membershipGrade || 'NORMAL',
            membershipGradeCode: data.membershipGradeCode || data.membershipGrade || null,
            membershipVerified: data.membershipVerified ?? false,
          })
        );
      }

      showToast('카카오 계정이 기존 계정에 연동되었습니다.', 'success');
      clearOAuthReturnTo();
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
  }, [formStep, isOAuthProcessing, isSignupFlow]);

  const signupHeadings: Record<string, string> = {
    signUpAccount: '이메일로 시작하세요',
    signUpFinal: '멤버십 정보를 입력하세요',
    oauthIntegration: '맞춤 혜택을 준비할게요',
    oauthLink: '기존 계정을 연결하세요',
  };

  const signupDescriptions: Record<string, string> = {
    signUpAccount: '이메일을 인증하고 로그인에 사용할 비밀번호를 설정합니다.',
    signUpFinal: '선택한 통신사와 등급에 맞는 혜택을 찾아드려요.',
    oauthIntegration: '카카오 계정으로 확인된 정보를 바탕으로 가입합니다.',
    oauthLink: '기존 계정을 확인하면 카카오 로그인과 함께 사용할 수 있어요.',
  };
  const signupSteps = [
    { key: 'signUpAccount', label: '계정 정보' },
    { key: 'signUpFinal', label: '멤버십 정보' },
  ];
  const signupStepIndex = signupSteps.findIndex((step) => step.key === formStep);
  const goToPreviousSignupStep = () => {
    if (formStep === 'signUpFinal') setFormStep('signUpAccount');
  };

  const renderFormContent = () => (
    <>
      {isSignupFlow && (
        <header className="mb-6 w-full">
          <div className="mb-5 flex min-h-11 items-center justify-between gap-3">
            {signupStepIndex > 0 ? (
              <button
                type="button"
                onClick={goToPreviousSignupStep}
                className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-grey05 transition-colors hover:bg-warmCanvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                이전 단계
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={goToLogin}
              className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-brandStrong transition-colors hover:bg-brandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              로그인으로 돌아가기
            </button>
          </div>
          {signupStepIndex >= 0 && (
            <ol aria-label="회원가입 진행 단계" className="mb-5 grid grid-cols-2 gap-2">
              {signupSteps.map((step, index) => (
                <li
                  key={step.key}
                  aria-current={index === signupStepIndex ? 'step' : undefined}
                  className={`border-t-2 pt-2 text-xs font-medium ${
                    index <= signupStepIndex
                      ? 'border-brand text-brandStrong'
                      : 'border-warmBorder text-grey04'
                  }`}
                >
                  {index + 1}. {step.label}
                </li>
              ))}
            </ol>
          )}
          <div className="text-left">
            <h1 className="text-title-4 text-grey07">{signupHeadings[formStep]}</h1>
            <p className="mt-2 text-body-3 leading-6 text-grey05">{signupDescriptions[formStep]}</p>
          </div>
        </header>
      )}
      {formStep === 'login' && (
        <LoginForm
          returnTo={returnTo}
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
          onGoToLogin={goToLogin}
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
    </>
  );

  if (isOAuthProcessing) {
    return (
      <div className={styles.page}>
        <div className={styles.mobileBrand}>
          <Link to="/" className={styles.brand} aria-label="잇플레이스 홈">
            <Image src="/brand/itplace-mark-b-rail.svg" width={36} height={36} alt="" />
            <span>잇플레이스</span>
          </Link>
        </div>
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
    <div className={styles.page}>
      <div className={styles.mobileBrand}>
        <Link to="/" className={styles.brand} aria-label="잇플레이스 홈">
          <Image src="/brand/itplace-mark-b-rail.svg" width={36} height={36} alt="" />
          <span>잇플레이스</span>
        </Link>
        <Link to="/benefits" className={styles.benefitsLink}>혜택 먼저 둘러보기</Link>
      </div>
      <div className={styles.surface}>
        <div className={styles.preview}>
          <AuthBenefitsPreview partners={previewPartners} />
        </div>
        <div className={styles.formSide}>
          <Link to="/" className={`${styles.brand} ${styles.desktopBrand}`} aria-label="잇플레이스 홈">
            <Image src="/brand/itplace-mark-b-rail.svg" width={36} height={36} alt="" />
            <span>잇플레이스</span>
          </Link>
          <section className={`${styles.formCard} ${isSignupFlow ? styles.signupCard : ''}`}>
            {renderFormContent()}
          </section>
          <Link to="/benefits" className={styles.desktopBenefitsLink}>혜택 먼저 둘러보기</Link>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
