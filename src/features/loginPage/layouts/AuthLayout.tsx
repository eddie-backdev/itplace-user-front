import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import MobileHeader from '../../../components/MobileHeader';
import AuthFormCard from '../components/common/AuthFormCard';
import AuthSideCard from '../components/common/AuthSideCard';
import { showToast } from '../../../utils/toast';
import LoginForm from '../components/login/LoginForm';
import FindPasswordForm from '../components/find/FindPasswordForm';
import OAuthIntegrationForm from '../components/signup/OAuthIntegrationForm';
import SignUpForm from '../components/signup/SignUpForm';
import SignUpFinalForm from '../components/signup/SignUpFinalForm';
import { oauthSignUp } from '../apis/user';
import { getOAuthResult } from '../apis/auth';
import { AuthTransition } from '../hooks/AuthTransition';
import { useDispatch } from 'react-redux';
import { setLoginSuccess } from '../../../store/authSlice';
import LoadingSpinner from '../../../components/LoadingSpinner';
import Modal from '../../../components/Modal';
import { useResponsive } from '../../../hooks/useResponsive';

const emptyLocalSignupData = {
  name: '',
  birthday: '',
  gender: '',
  carrier: '',
  membershipGradeCode: '',
};

const emptyOAuthUserData = {
  name: '',
  birthday: '',
  gender: '',
  carrier: '',
  membershipGradeCode: '',
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
    goToSignUpFinal,
    goToFindPassword,
  } = AuthTransition();

  const location = useLocation();
  const [signUpData, setSignUpData] = useState(emptyLocalSignupData);
  const [oauthUserData, setOAuthUserData] = useState(emptyOAuthUserData);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const { isMobile } = useResponsive();
  const hasInitialized = useRef(false);

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
        window.history.replaceState({}, '', '/login');
        navigate('/main');
      } else if (code === 'PRE_AUTHENTICATION_SUCCESS') {
        window.history.replaceState({}, '', '/login?step=oauthIntegration&verifiedType=oauth');
        setFormStep('oauthIntegration');
      } else {
        showToast('로그인에 실패했습니다.', 'error');
        window.history.replaceState({}, '', '/login');
      }
    } catch {
      showToast('로그인에 실패했습니다.', 'error');
      window.history.replaceState({}, '', '/login');
    } finally {
      setShowOAuthModal(false);
    }
  }, [dispatch, navigate, setFormStep]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const step = params.get('step');
    const verifiedType = params.get('verifiedType');
    const oauth = params.get('oauth');

    if (oauth === 'processing' && !showOAuthModal) {
      setShowOAuthModal(true);
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
  }, [location.search, setFormStep, checkOAuthResult, showOAuthModal]);

  useEffect(() => {
    if (location.state?.resetToLogin) {
      goToLogin();
      window.history.replaceState({}, '', '/login');
    }
  }, [location.state, goToLogin]);

  const handleOAuthSignup = async ({
    email,
    birthday,
    gender,
    carrier,
    membershipGradeCode,
  }: {
    email: string;
    birthday: string;
    gender: string;
    carrier: string;
    membershipGradeCode: string;
  }) => {
    try {
      await oauthSignUp({
        name: oauthUserData.name,
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
        <SignUpForm
          initialName={signUpData.name}
          initialBirthday={signUpData.birthday}
          initialGender={signUpData.gender}
          initialCarrier={signUpData.carrier}
          initialMembershipGradeCode={signUpData.membershipGradeCode}
          onGoToLogin={goToLogin}
          onNext={(data) => {
            setSignUpData(data);
            goToSignUpFinal();
          }}
        />
      )}

      {formStep === 'signUpFinal' && (
        <SignUpFinalForm
          onGoToLogin={goToLogin}
          name={signUpData.name}
          birthday={signUpData.birthday}
          gender={signUpData.gender}
          carrier={signUpData.carrier}
          membershipGradeCode={signUpData.membershipGradeCode}
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-white max-md:overflow-hidden max-md:h-screen max-md:fixed max-md:inset-0 max-sm:overflow-hidden max-sm:max-h-screen max-sm:fixed max-sm:inset-0">
      <div className="fixed top-0 left-0 w-full z-[9999] max-md:block hidden">
        <MobileHeader title="로그인" />
      </div>

      <Modal isOpen={showOAuthModal} onClose={() => {}}>
        <div className="flex flex-col items-center py-4">
          <LoadingSpinner />
          <p className="mt-4 text-body-2 text-grey04">카카오 로그인 처리 중입니다...</p>
        </div>
      </Modal>

      <div className="max-md:block hidden w-full fixed max-md:fixed max-md:inset-0 max-sm:block max-sm:fixed max-sm:inset-0">
        <div className="absolute top-0 left-0 w-full h-1/2">
          <AuthSideCard />
        </div>

        <div className="absolute left-0 w-full" style={{ bottom: '0', top: 'calc(60dvh - 13rem)' }}>
          <div
            className="bg-white rounded-t-[24px] px-6 pt-8 pb-8 w-full shadow-2xl"
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

      <div className="max-md:hidden relative w-full max-w-[1400px] max-xl:max-w-[1200px] max-lg:max-w-[900px] max-md:max-w-[768px] h-[700px] max-xl:h-[600px] max-lg:h-[500px] max-md:h-[450px] overflow-hidden mx-auto">
        <div
          ref={formCardRef}
          className="absolute top-1/2 translate-y-[-50%] w-[583px] max-xl:w-[500px] max-lg:w-[375px] h-[639px] max-xl:h-[548px] max-lg:h-[430px] left-[calc(50%-520px)] max-xl:left-[calc(50%-446px)] max-lg:left-[calc(50%-335px)]"
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
