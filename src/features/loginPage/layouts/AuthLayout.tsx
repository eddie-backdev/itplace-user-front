import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import MobileHeader from '../../../components/MobileHeader';

// 공통 컴포넌트
import AuthFormCard from '../components/common/AuthFormCard';
import AuthSideCard from '../components/common/AuthSideCard';
import { showToast } from '../../../utils/toast';

// 폼 컴포넌트
import LoginForm from '../components/login/LoginForm';
import PhoneAuthForm from '../components/verification/PhoneAuthForm';
import FindEmailForm from '../components/find/FindEmailForm';
import FindPasswordForm from '../components/find/FindPasswordForm';
import OAuthIntegrationForm from '../components/signup/OAuthIntegrationForm';

// API
import { oauthSignUp } from '../apis/user';
import { getOAuthResult, oauthAccountLink } from '../apis/auth';

// 상태 전환 관련 훅
import { AuthTransition } from '../hooks/AuthTransition';
import { useDispatch } from 'react-redux';
import { setLoginSuccess } from '../../../store/authSlice';
import LoadingSpinner from '../../../components/LoadingSpinner';
import Modal from '../../../components/Modal';
import { useResponsive } from '../../../hooks/useResponsive';

const AuthLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    formStep,
    setFormStep,
    formCardRef,
    sideCardRef,
    goToLogin,
    goToPhoneAuth,
    goToVerification,
    goToSignUp,
    goToSignUpFinal,
    goToFindEmail,
  } = AuthTransition();

  const location = useLocation();

  const [mode, setMode] = useState<'signup' | 'find'>('signup');
  const [showTab, setShowTab] = useState(false);

  const [userData, setUserData] = useState({
    name: '',
    phone: '',
    birthday: '',
    gender: '',
    membershipId: '',
    verifiedType: '',
  });

  const [oauthUserData, setOAuthUserData] = useState({
    name: '',
    phone: '',
    birthday: '',
    gender: '',
    membershipId: '',
    verifiedType: '',
  });

  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const { isMobile } = useResponsive();

  const hasInitialized = useRef(false);

  const checkOAuthResult = useCallback(async () => {
    try {
      // 최소 1초는 모달을 표시하기 위해 Promise.all 사용
      const [response] = await Promise.all([
        getOAuthResult(),
        new Promise((resolve) => setTimeout(resolve, 1000)), // 1초 대기
      ]);

      const { code, data } = response.data;

      if (code === 'OAUTH_INFO_FOUND') {
        const userData = data;
        if (userData) {
          dispatch(
            setLoginSuccess({
              name: userData.name,
              membershipGrade: userData.membershipGrade || 'NORMAL',
            })
          );
        }

        showToast('로그인에 성공하셨습니다!', 'success');

        // URL에서 oauth 파라미터 제거
        window.history.replaceState({}, '', '/login');

        navigate('/main');
      } else if (code === 'PRE_AUTHENTICATION_SUCCESS') {
        // URL에서 oauth 파라미터 제거
        window.history.replaceState({}, '', '/login?step=phoneAuth&verifiedType=oauth');

        setMode('signup');
        setShowTab(false);
        goToPhoneAuth();
      } else {
        showToast('로그인에 실패했습니다.', 'error');

        // URL에서 oauth 파라미터 제거
        window.history.replaceState({}, '', '/login');
      }
    } catch {
      showToast('로그인에 실패했습니다.', 'error');

      // URL에서 oauth 파라미터 제거
      window.history.replaceState({}, '', '/login');
    } finally {
      setShowOAuthModal(false);
    }
  }, [dispatch, navigate, goToPhoneAuth, setMode, setShowTab]);

  const handleOAuthToLocalMerge = async (phoneNumber: string) => {
    try {
      const response = await oauthAccountLink(phoneNumber);

      showToast('계정이 성공적으로 통합되었습니다!', 'success');

      // 통합 완료 후 로그인 성공 처리 (필요시)
      if (response.data?.data) {
        const userData = response.data.data;
        dispatch(
          setLoginSuccess({
            name: userData.name,
            membershipGrade: userData.membershipGrade || 'NORMAL',
          })
        );
        navigate('/main');
      } else {
        // 통합만 완료, 로그인은 별도로
        showToast('이제 카카오 로그인을 사용하실 수 있습니다!', 'success');
        goToLogin();
      }
    } catch {
      showToast('계정 통합에 실패했습니다. 다시 시도해주세요.', 'error');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const step = params.get('step');
    const verifiedType = params.get('verifiedType');
    const oauth = params.get('oauth');

    // OAuth 처리 중 파라미터가 있으면 모달 표시하고 결과 확인
    if (oauth === 'processing' && !showOAuthModal) {
      setShowOAuthModal(true);
      checkOAuthResult();
      return;
    }

    // OAuth 관련 URL 파라미터가 있을 때만 처리
    // 일반적인 로그인 리셋은 별도 useEffect에서 처리

    if (hasInitialized.current) return; // 이미 초기화했으면 실행하지 않음

    if (step === 'phoneAuth' && verifiedType === 'oauth') {
      setMode('signup');
      setShowTab(false);
      goToPhoneAuth();
      hasInitialized.current = true; // 초기화 완료 표시
    }

    if (step === 'oauthIntegration' && verifiedType === 'oauth') {
      setOAuthUserData({
        name: params.get('name') || '',
        phone: params.get('phone') || '',
        birthday: params.get('birthday') || '',
        gender: params.get('gender') || '',
        membershipId: params.get('membershipId') || '',
        verifiedType: verifiedType || '', // verifiedType 추가
      });
      setFormStep('oauthIntegration');
      hasInitialized.current = true; // 초기화 완료 표시
    }
  }, [location.search, goToPhoneAuth, setFormStep, formStep, checkOAuthResult, showOAuthModal]);

  // state를 통한 로그인 리셋 처리
  useEffect(() => {
    if (location.state?.resetToLogin) {
      setMode('signup');
      setShowTab(false);
      goToLogin();
      // state 정리
      window.history.replaceState({}, '', '/login');
    }
  }, [location.state, goToLogin]);

  useEffect(() => {}, [formStep]);

  const handleOAuthSignup = async (birthday: string, gender: string) => {
    try {
      const payload = {
        name: oauthUserData.name,
        phoneNumber: oauthUserData.phone,
        gender,
        birthday,
        membershipId: oauthUserData.membershipId,
      };

      await oauthSignUp(payload);

      // 회원가입 성공 후 반환된 사용자 정보 확인
      // 회원가입 성공 - 로그인 화면으로 이동
      showToast('회원가입에 성공하셨습니다!', 'success');

      // 즉시 애니메이션 실행 후 상태 초기화
      goToLogin();

      // 상태 초기화
      setTimeout(() => {
        setOAuthUserData({
          name: '',
          phone: '',
          birthday: '',
          gender: '',
          membershipId: '',
          verifiedType: '',
        });
      }, 500); // 애니메이션 완료 후 초기화
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-white max-md:overflow-hidden max-md:h-screen max-md:fixed max-md:inset-0 max-sm:overflow-hidden max-sm:max-h-screen max-sm:fixed max-sm:inset-0">
      <div className="fixed top-0 left-0 w-full z-[9999] max-md:block hidden">
        <MobileHeader title="로그인" />
      </div>
      {/* OAuth 로딩 모달 */}
      <Modal
        isOpen={showOAuthModal}
        onClose={() => {}} // 사용자가 직접 닫을 수 없도록 빈 함수
      >
        <div className="flex flex-col items-center py-4">
          <LoadingSpinner />
          <p className="mt-4 text-body-2 text-grey04">카카오 로그인 처리 중입니다...</p>
        </div>
      </Modal>

      {/* 모바일 레이아웃 (max-md: ~767px) */}
      <div className="max-md:block hidden w-full fixed max-md:fixed max-md:inset-0 max-sm:block max-sm:fixed max-sm:inset-0">
        {/* 배경 SideCard - 전체 화면 */}
        <div className="absolute top-0 left-0 w-full h-1/2">
          <AuthSideCard />
        </div>

        {/* 하단에서 올라오는 오버레이 폼 카드 - 전체 너비 */}
        <div className="absolute left-0 w-full" style={{ bottom: '0', top: 'calc(60dvh - 13rem)' }}>
          <div
            className="bg-white rounded-t-[24px] px-6 pt-8 pb-8 w-full shadow-2xl"
            style={{
              height: '100%', // 부모 높이만큼
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
            }} // 헤더 높이를 고려해서 조정
          >
            {/* 로그인 */}
            {formStep === 'login' && (
              <LoginForm
                onGoToPhoneAuth={() => {
                  setMode('signup');
                  setShowTab(false);
                  goToPhoneAuth();
                }}
                onGoToFindEmail={() => {
                  setMode('find');
                  setShowTab(true);
                  goToFindEmail();
                }}
              />
            )}

            {/* 인증 / 회원가입 / 아이디/비번 찾기 진입 */}
            {(formStep === 'phoneAuth' ||
              formStep === 'verification' ||
              formStep === 'signUp' ||
              formStep === 'signUpFinal') && (
              <PhoneAuthForm
                mode={mode}
                title={mode === 'find' ? '' : '번호 인증을 위한\n개인 정보를 입력해주세요'}
                currentStep={formStep}
                showTab={showTab}
                onGoToLogin={goToLogin}
                onAuthComplete={({ name, phone }) => {
                  setUserData({
                    name,
                    phone,
                    birthday: '',
                    gender: '',
                    membershipId: '',
                    verifiedType: '',
                  });
                  goToVerification();
                }}
                onVerified={(verifiedType, user) => {
                  const urlParams = new URLSearchParams(location.search);
                  const isOAuthFlow = urlParams.get('verifiedType') === 'oauth';

                  if (isOAuthFlow || verifiedType === 'oauth-new') {
                    setOAuthUserData({
                      name: user.name,
                      phone: user.phone,
                      birthday: user.birthday,
                      gender: user.gender,
                      membershipId: user.membershipId,
                      verifiedType: verifiedType,
                    });
                    setFormStep('oauthIntegration');
                  } else {
                    if (verifiedType === 'new' && mode === 'find') {
                      setFormStep('findEmail');
                    } else if (verifiedType === 'new' || verifiedType === 'uplus') {
                      goToSignUp();
                    } else if (verifiedType === 'oauth-to-local-merge') {
                      handleOAuthToLocalMerge(user.phone);
                    } else if (verifiedType === 'local-to-oauth-merge') {
                      setUserData({
                        name: user.name,
                        phone: user.phone,
                        birthday: user.birthday,
                        gender: user.gender,
                        membershipId: user.membershipId,
                        verifiedType: verifiedType,
                      });
                      goToSignUp();
                    } else if (verifiedType === 'oauth') {
                      setOAuthUserData({
                        name: user.name,
                        phone: user.phone,
                        birthday: user.birthday,
                        gender: user.gender,
                        membershipId: user.membershipId,
                        verifiedType: verifiedType,
                      });
                      setFormStep('oauthIntegration');
                    } else {
                      goToLogin();
                    }
                  }
                }}
                onSignUpComplete={goToSignUpFinal}
                nameFromPhoneAuth={userData.name}
                phoneFromPhoneAuth={userData.phone}
              />
            )}

            {/* OAuth 통합 */}
            {formStep === 'oauthIntegration' && (
              <OAuthIntegrationForm
                name={oauthUserData.name}
                phone={oauthUserData.phone}
                birthday={oauthUserData.birthday}
                gender={oauthUserData.gender}
                membershipId={oauthUserData.membershipId}
                onGoToLogin={goToLogin}
                onNext={({ birthday, gender }) => {
                  handleOAuthSignup(birthday, gender);
                }}
                isOAuthNew={oauthUserData.verifiedType === 'oauth-new'}
              />
            )}

            {/* 아이디 찾기 */}
            {formStep === 'findEmail' && (
              <FindEmailForm
                onGoToLogin={goToLogin}
                onClickTabPassword={() => setFormStep('findPassword')}
              />
            )}

            {/* 비밀번호 찾기 */}
            {formStep === 'findPassword' && (
              <FindPasswordForm
                onGoToLogin={goToLogin}
                onClickTabEmail={() => setFormStep('findEmail')}
              />
            )}
          </div>
        </div>
      </div>

      {/* 데스크톱/태블릿 레이아웃 (md 이상: 768px~) - 기존 그대로 유지 */}
      <div className="max-md:hidden relative w-full max-w-[1400px] max-xl:max-w-[1200px] max-lg:max-w-[900px] max-md:max-w-[768px] h-[700px] max-xl:h-[600px] max-lg:h-[500px] max-md:h-[450px] overflow-hidden mx-auto">
        {/* 좌측 카드 */}
        <div
          ref={formCardRef}
          className="absolute top-1/2 translate-y-[-50%] w-[583px] max-xl:w-[500px] max-lg:w-[375px] h-[639px] max-xl:h-[548px] max-lg:h-[430px] left-[calc(50%-520px)] max-xl:left-[calc(50%-446px)] max-lg:left-[calc(50%-335px)]"
        >
          <AuthFormCard radius={formStep === 'login' ? 'left' : 'right'}>
            <>
              {/* 로그인 */}
              {formStep === 'login' && (
                <LoginForm
                  onGoToPhoneAuth={() => {
                    setMode('signup');
                    setShowTab(false);
                    goToPhoneAuth();
                  }}
                  onGoToFindEmail={() => {
                    setMode('find');
                    setShowTab(true);
                    goToFindEmail();
                  }}
                />
              )}

              {/* 인증 / 회원가입 / 아이디/비번 찾기 진입 */}
              {(formStep === 'phoneAuth' ||
                formStep === 'verification' ||
                formStep === 'signUp' ||
                formStep === 'signUpFinal') && (
                <PhoneAuthForm
                  mode={mode}
                  title={mode === 'find' ? '' : '번호 인증을 위한\n개인 정보를 입력해주세요'}
                  currentStep={formStep}
                  showTab={showTab}
                  onGoToLogin={goToLogin}
                  onAuthComplete={({ name, phone }) => {
                    setUserData({
                      name,
                      phone,
                      birthday: '',
                      gender: '',
                      membershipId: '',
                      verifiedType: '',
                    });
                    goToVerification();
                  }}
                  onVerified={(verifiedType, user) => {
                    const urlParams = new URLSearchParams(location.search);
                    const isOAuthFlow = urlParams.get('verifiedType') === 'oauth';

                    if (isOAuthFlow || verifiedType === 'oauth-new') {
                      // OAuth 플로우는 모든 경우에 OAuthIntegrationForm으로
                      setOAuthUserData({
                        name: user.name,
                        phone: user.phone,
                        birthday: user.birthday,
                        gender: user.gender,
                        membershipId: user.membershipId,
                        verifiedType: verifiedType,
                      });
                      setFormStep('oauthIntegration');
                    } else {
                      // 일반 플로우는 기존 분기 로직 유지
                      if (verifiedType === 'new' && mode === 'find') {
                        setFormStep('findEmail');
                      } else if (verifiedType === 'new' || verifiedType === 'uplus') {
                        goToSignUp();
                      } else if (verifiedType === 'oauth-to-local-merge') {
                        // OAuth → 로컬 통합: 바로 계정 연결 API 호출
                        handleOAuthToLocalMerge(user.phone);
                      } else if (verifiedType === 'local-to-oauth-merge') {
                        // 로컬 → OAuth 통합: 회원가입 폼으로 이동
                        setUserData({
                          name: user.name,
                          phone: user.phone,
                          birthday: user.birthday,
                          gender: user.gender,
                          membershipId: user.membershipId,
                          verifiedType: verifiedType,
                        });
                        goToSignUp();
                      } else if (verifiedType === 'oauth') {
                        setOAuthUserData({
                          name: user.name,
                          phone: user.phone,
                          birthday: user.birthday,
                          gender: user.gender,
                          membershipId: user.membershipId,
                          verifiedType: verifiedType,
                        });
                        setFormStep('oauthIntegration');
                      } else {
                        goToLogin();
                      }
                    }
                  }}
                  onSignUpComplete={goToSignUpFinal}
                  nameFromPhoneAuth={userData.name}
                  phoneFromPhoneAuth={userData.phone}
                />
              )}

              {/* OAuth 통합 */}
              {formStep === 'oauthIntegration' && (
                <>
                  <OAuthIntegrationForm
                    name={oauthUserData.name}
                    phone={oauthUserData.phone}
                    birthday={oauthUserData.birthday}
                    gender={oauthUserData.gender}
                    membershipId={oauthUserData.membershipId}
                    onGoToLogin={goToLogin}
                    onNext={({ birthday, gender }) => {
                      handleOAuthSignup(birthday, gender);
                    }}
                    isOAuthNew={oauthUserData.verifiedType === 'oauth-new'}
                  />
                </>
              )}

              {/* 아이디 찾기 */}
              {formStep === 'findEmail' && (
                <FindEmailForm
                  onGoToLogin={goToLogin}
                  onClickTabPassword={() => setFormStep('findPassword')}
                />
              )}

              {/* 비밀번호 찾기 */}
              {formStep === 'findPassword' && (
                <FindPasswordForm
                  onGoToLogin={goToLogin}
                  onClickTabEmail={() => setFormStep('findEmail')}
                />
              )}
            </>
          </AuthFormCard>
        </div>

        {/* 우측 카드 */}
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
