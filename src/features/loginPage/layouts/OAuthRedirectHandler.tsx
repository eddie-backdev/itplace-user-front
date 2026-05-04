import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setLoginSuccess } from '../../../store/authSlice';
import { kakaoOAuthLogin } from '../apis/auth';
import { showToast } from '../../../utils/toast';

const OAuthRedirectHandler = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleKakaoCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        navigate('/login');
        return;
      }

      if (!code) {
        navigate('/login');
        return;
      }

      try {
        const response = await kakaoOAuthLogin(code);
        const { code: responseCode } = response.data;

        if (responseCode === 'PRE_AUTHENTICATION_SUCCESS') {
          // PRE_AUTHENTICATION_SUCCESS에서도 기본 사용자 정보가 있는지 확인
          navigate('/login?step=oauthIntegration&verifiedType=oauth');
        } else if (responseCode === 'LOGIN_SUCCESS') {
          // Redux에 로그인 정보 저장
          const userData = response.data?.data;
          if (userData) {
            dispatch(
              setLoginSuccess({
                name: userData.name,
                carrier: userData.carrier ?? null,
                membershipGrade: userData.membershipGradeCode || userData.membershipGrade || null,
                membershipGradeCode:
                  userData.membershipGradeCode || userData.membershipGrade || null,
                membershipVerified: userData.membershipVerified ?? false,
              })
            );
          }

          // 로그인 성공 토스트
          showToast('로그인에 성공하셨습니다!', 'success');
          navigate('/');
        } else {
          navigate('/login');
        }
      } catch {
        navigate('/login');
      }
    };

    handleKakaoCallback();
  }, [dispatch, navigate, searchParams]);

  return <div>카카오 로그인 처리 중입니다...</div>;
};

export default OAuthRedirectHandler;
