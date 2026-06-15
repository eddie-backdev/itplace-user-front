import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import MobileHeader from '../../../components/MobileHeader';
import AuthFormCard from '../components/common/AuthFormCard';
import AuthSideCard from '../components/common/AuthSideCard';
import { showToast } from '../../../utils/toast';
import LoginForm from '../components/login/LoginForm';
import FindPasswordForm from '../components/find/FindPasswordForm';
import OAuthIntegrationForm from '../components/signup/OAuthIntegrationForm';
import SignUpAccountForm from '../components/signup/SignUpAccountForm';
import SignUpPhoneVerificationForm from '../components/signup/SignUpPhoneVerificationForm';
import SignUpFinalForm from '../components/signup/SignUpFinalForm';
import { oauthSignUp } from '../apis/user';
import { getOAuthResult } from '../apis/auth';
import { AuthTransition } from '../hooks/AuthTransition';
import { useDispatch } from 'react-redux';
import { setLoginSuccess } from '../../../store/authSlice';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useResponsive } from '../../../hooks/useResponsive';
import { TbMapPin, TbSparkles, TbTicket, TbHeartHandshake } from 'react-icons/tb';

const emptyLocalSignupData = {
  phoneNumber: '',
  name: '',
  birthday: '',
  gender: '',
  carrier: '',
  membershipGradeCode: '',
  email: '',
  password: '',
  passwordConfirm: '',
};

const emptyOAuthUserData = {
  name: '',
  birthday: '',
  gender: '',
  carrier: '',
  membershipGradeCode: '',
};

const SignupFlowCard = ({ children }: { children: ReactNode }) => {
  const motifs = [
    {
      label: '내 주변 혜택',
      detail: '지도 기반 탐색',
      icon: TbMapPin,
      tone: 'from-purple04 to-purple03',
    },
    {
      label: '멤버십 등급',
      detail: '맞춤 혜택',
      icon: TbTicket,
      tone: 'from-orange04 to-orange03',
    },
    {
      label: '관심 혜택',
      detail: '놓치지 않게',
      icon: TbSparkles,
      tone: 'from-pink03 to-purple03',
    },
  ];

  return (
    <section className="relative w-full max-w-[540px] overflow-hidden rounded-[30px] border border-purple02/70 bg-white shadow-[0_24px_60px_rgba(37,9,97,0.14)]">
      <div className="relative overflow-hidden bg-gradient-to-br from-purple05 via-purple04 to-orange04 px-8 pb-6 pt-7 text-white max-lg:px-7">
        <div className="absolute -right-12 -top-16 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-16 left-10 h-36 w-36 rounded-full bg-orange02/25 blur-2xl" />

        <div className="relative flex items-center justify-center gap-5">
          {motifs.map((motif, index) => {
            const Icon = motif.icon;
            const isCenter = index === 1;
            return (
              <div key={motif.label} className="flex flex-col items-center">
                <span
                  className={`flex items-center justify-center rounded-[24px] bg-gradient-to-br ${motif.tone} text-white shadow-[0_14px_30px_rgba(37,9,97,0.2)] ring-1 ring-white/25 ${
                    isCenter ? 'h-[68px] w-[68px]' : 'mt-2 h-[54px] w-[54px]'
                  }`}
                >
                  <Icon className={isCenter ? 'text-[32px]' : 'text-[25px]'} strokeWidth={1.7} />
                </span>
                <span className="mt-2 text-caption font-semibold text-white/90">{motif.label}</span>
                <span className="mt-0.5 text-caption-2 text-white/65">{motif.detail}</span>
              </div>
            );
          })}
        </div>

        <div className="relative mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-title-7 font-bold text-white/90">
            <TbHeartHandshake className="text-[22px]" strokeWidth={1.8} />
            IT:PLACE 회원가입
          </div>
          <p className="mt-2.5 text-title-5 font-bold leading-snug max-lg:text-title-6">
            내 멤버십에 맞는 혜택을
            <br />더 빠르게 찾아드릴게요
          </p>
        </div>
      </div>

      <div className="bg-white px-8 pb-8 pt-7 max-lg:px-7">
        <div className="mx-auto flex w-full max-w-[360px] flex-col items-center">{children}</div>
      </div>
    </section>
  );
};

const AuthLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    formStep,
    setFormStep,
    formCardRef,
    sideCardRef,
    goToLogin,
    goToSignUp,
    goToSignUpAccount,
    goToSignUpFinal,
    goToFindPassword,
  } = AuthTransition();

  const location = useLocation();
  const [signUpData, setSignUpData] = useState(emptyLocalSignupData);
  const [oauthUserData, setOAuthUserData] = useState(emptyOAuthUserData);
  const [isOAuthProcessing, setIsOAuthProcessing] = useState(false);
  const { isMobile } = useResponsive();
  const hasInitialized = useRef(false);
  const isSignupFlow =
    formStep === 'signUp' ||
    formStep === 'signUpAccount' ||
    formStep === 'signUpFinal' ||
    formStep === 'oauthIntegration';

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
              name: data.name,
              carrier: data.carrier ?? null,
              membershipGrade: data.membershipGradeCode || data.membershipGrade || 'NORMAL',
              membershipGradeCode: data.membershipGradeCode || data.membershipGrade || null,
              membershipVerified: data.membershipVerified ?? false,
            })
          );
        }

        showToast('로그인에 성공하셨습니다!', 'success');
        navigate('/', { replace: true });
      } else if (code === 'PRE_AUTHENTICATION_SUCCESS') {
        navigate('/login?step=oauthIntegration&verifiedType=oauth', { replace: true });
        setFormStep('oauthIntegration');
      } else {
        showToast('로그인에 실패했습니다.', 'error');
        navigate('/login', { replace: true });
      }
    } catch {
      showToast('로그인에 실패했습니다.', 'error');
      navigate('/login', { replace: true });
    } finally {
      setIsOAuthProcessing(false);
    }
  }, [dispatch, navigate, setFormStep]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const step = params.get('step');
    const verifiedType = params.get('verifiedType');
    const oauth = params.get('oauth');

    if (oauth === 'processing' && !isOAuthProcessing) {
      setIsOAuthProcessing(true);
      checkOAuthResult();
      return;
    }

    if (hasInitialized.current) return;

    if (step === 'oauthIntegration' && verifiedType === 'oauth') {
      setOAuthUserData({
        name: params.get('name') || '',
        birthday: params.get('birthday') || '',
        gender: params.get('gender') || '',
        carrier: params.get('carrier') || '',
        membershipGradeCode: params.get('membershipGradeCode') || '',
      });
      setFormStep('oauthIntegration');
      hasInitialized.current = true;
    }
  }, [location.search, setFormStep, checkOAuthResult, isOAuthProcessing]);

  useEffect(() => {
    if (location.state?.resetToLogin) {
      goToLogin();
      window.history.replaceState({}, '', '/login');
    }
  }, [location.state, goToLogin]);

  const handleOAuthSignup = async ({
    name,
    email,
    birthday,
    gender,
    carrier,
    membershipGradeCode,
  }: {
    name: string;
    email: string;
    birthday: string;
    gender: string;
    carrier: string;
    membershipGradeCode: string;
  }) => {
    try {
      await oauthSignUp({
        name,
        email,
        gender,
        birthday,
        carrier,
        membershipGradeCode,
      });

      showToast('회원가입이 완료되었습니다.', 'success');
      goToLogin();

      setTimeout(() => {
        setOAuthUserData(emptyOAuthUserData);
      }, 500);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const msg =
        axiosError.response?.data?.message || '회원가입에 실패했습니다. 다시 시도해주세요.';

      showToast(msg, 'error');
    }
  };

  useEffect(() => {
    if (isMobile) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobile]);

  useEffect(() => {
    if (isSignupFlow || isOAuthProcessing) {
      window.scrollTo(0, 0);
    }
  }, [formStep, isOAuthProcessing, isSignupFlow]);

  const renderFormContent = () => (
    <>
      {formStep === 'login' && (
        <LoginForm
          onGoToSignUp={() => {
            setSignUpData(emptyLocalSignupData);
            goToSignUp();
          }}
          onGoToFindPassword={goToFindPassword}
        />
      )}

      {formStep === 'signUp' && (
        <SignUpPhoneVerificationForm
          initialPhoneNumber={signUpData.phoneNumber}
          onGoToLogin={goToLogin}
          onNext={(phoneNumber) => {
            setSignUpData((previous) => ({ ...previous, phoneNumber }));
            goToSignUpAccount();
          }}
        />
      )}

      {formStep === 'signUpAccount' && (
        <SignUpAccountForm
          phoneNumber={signUpData.phoneNumber}
          initialEmail={signUpData.email}
          initialPassword={signUpData.password}
          initialPasswordConfirm={signUpData.passwordConfirm}
          onGoToLogin={goToLogin}
          onNext={(accountData) => {
            setSignUpData((previous) => ({ ...previous, ...accountData }));
            goToSignUpFinal();
          }}
        />
      )}

      {formStep === 'signUpFinal' && (
        <SignUpFinalForm
          onGoToLogin={goToLogin}
          phoneNumber={signUpData.phoneNumber}
          email={signUpData.email}
          password={signUpData.password}
          passwordConfirm={signUpData.passwordConfirm}
          initialName={signUpData.name}
          initialBirthday={signUpData.birthday}
          initialGender={signUpData.gender}
          initialCarrier={signUpData.carrier}
          initialMembershipGradeCode={signUpData.membershipGradeCode}
        />
      )}

      {formStep === 'oauthIntegration' && (
        <OAuthIntegrationForm
          name={oauthUserData.name}
          birthday={oauthUserData.birthday}
          gender={oauthUserData.gender}
          carrier={oauthUserData.carrier}
          membershipGradeCode={oauthUserData.membershipGradeCode}
          onGoToLogin={goToLogin}
          onNext={handleOAuthSignup}
        />
      )}

      {formStep === 'findPassword' && <FindPasswordForm onGoToLogin={goToLogin} />}
    </>
  );

  if (isOAuthProcessing) {
    return (
      <div
        key="oauth-processing"
        className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center"
      >
        <LoadingSpinner />
        <p className="mt-5 text-title-6 font-bold text-black max-sm:text-title-7">
          카카오 로그인 처리 중입니다
        </p>
        <p className="mt-2 text-body-3 leading-6 text-grey04 max-sm:text-body-4">
          계정 정보를 확인하고 있어요. 잠시만 기다려 주세요.
        </p>
      </div>
    );
  }

  if (isSignupFlow) {
    return (
      <div
        key="signup-flow"
        className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-br from-[#fbf8ff] via-white to-[#fff6ec] max-md:fixed max-md:inset-0 max-md:h-[100dvh] max-md:bg-white max-md:overflow-hidden"
      >
        <div className="pointer-events-none absolute left-[7%] top-8 h-64 w-64 rounded-full bg-purple02/35 blur-3xl max-md:hidden" />
        <div className="pointer-events-none absolute bottom-10 right-[8%] h-72 w-72 rounded-full bg-orange02/35 blur-3xl max-md:hidden" />
        <div className="pointer-events-none absolute left-[58%] top-[18%] h-28 w-28 rounded-full border border-purple02/50 max-md:hidden" />

        <div className="fixed top-0 left-0 z-[9999] hidden w-full max-md:block">
          <MobileHeader title="회원가입" />
        </div>

        <div
          className="hidden h-full overflow-y-auto bg-white px-6 pb-8 pt-[86px] max-md:block"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {renderFormContent()}
        </div>

        <div className="relative flex min-h-[100dvh] w-full items-start justify-center overflow-y-auto px-6 py-10 max-md:hidden">
          <div className="flex w-full max-w-[540px] justify-center" style={{ transform: 'none' }}>
            <SignupFlowCard>{renderFormContent()}</SignupFlowCard>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key="auth-panel"
      className="flex items-center justify-center min-h-screen bg-white max-md:overflow-hidden max-md:h-screen max-md:fixed max-md:inset-0 max-sm:overflow-hidden max-sm:max-h-screen max-sm:fixed max-sm:inset-0"
    >
      <div className="fixed top-0 left-0 w-full z-[9999] max-md:block hidden">
        <MobileHeader title="로그인" />
      </div>

      <div className="max-md:block hidden w-full fixed max-md:fixed max-md:inset-0 max-sm:block max-sm:fixed max-sm:inset-0">
        <div className="absolute top-0 left-0 w-full h-1/2">
          <AuthSideCard />
        </div>

        <div className="absolute left-0 w-full" style={{ bottom: '0', top: 'calc(60dvh - 13rem)' }}>
          <div
            className="w-full rounded-t-[24px] bg-white px-6 pb-8 pt-8 shadow-2xl"
            style={{
              height: '100%',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {renderFormContent()}
          </div>
        </div>
      </div>

      <div className="max-md:hidden relative mx-auto h-[700px] w-full max-w-[1400px] overflow-hidden max-xl:h-[600px] max-xl:max-w-[1200px] max-lg:h-[500px] max-lg:max-w-[900px] max-md:h-[450px] max-md:max-w-[768px]">
        <div
          ref={formCardRef}
          className="absolute top-1/2 left-[calc(50%-520px)] h-[639px] w-[583px] translate-y-[-50%] max-xl:left-[calc(50%-446px)] max-xl:h-[548px] max-xl:w-[500px] max-lg:left-[calc(50%-335px)] max-lg:h-[430px] max-lg:w-[375px]"
        >
          <AuthFormCard radius={formStep === 'login' ? 'left' : 'right'}>
            <>{renderFormContent()}</>
          </AuthFormCard>
        </div>

        <div
          ref={sideCardRef}
          className="absolute top-1/2 translate-y-[-50%] w-[431px] max-xl:w-[370px] max-lg:w-[277px] h-[639px] max-xl:h-[548px] max-lg:h-[430px] z-0 left-[calc(50%+30.5px)] max-xl:left-[calc(50%+26px)] max-lg:left-[calc(50%+20px)]"
        >
          <AuthSideCard />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
