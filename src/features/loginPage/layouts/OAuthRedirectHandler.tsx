import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from '@/lib/navigation';
import { useDispatch } from 'react-redux';
import { setLoginSuccess } from '../../../store/authSlice';
import { kakaoOAuthLogin } from '../apis/auth';
import { showToast } from '../../../utils/toast';
import { storeOAuthPreAuth } from '../utils/oauthPreAuthStorage';

const OAuthRedirectHandler = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handledCallbackRef = useRef<string | null>(null);

  useEffect(() => {
    const handleKakaoCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const callbackKey = `${code ?? ''}:${error ?? ''}`;
      if (handledCallbackRef.current === callbackKey) return;
      handledCallbackRef.current = callbackKey;

      if (error) {
        navigate('/login', { replace: true });
        return;
      }

      if (!code) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const response = await kakaoOAuthLogin(code);
        const { code: responseCode } = response.data;

        if (responseCode === 'PRE_AUTHENTICATION_SUCCESS') {
          const preAuthData = response.data?.data;
          const stored = storeOAuthPreAuth({
            email: preAuthData?.email ?? '',
            nickname: preAuthData?.nickname ?? '',
          });
          if (!stored) throw new Error('OAuth 사전 인증 정보를 저장하지 못했습니다.');
          const params = new URLSearchParams({
            step: 'oauthIntegration',
            verifiedType: 'oauth',
          });
          navigate(`/login?${params.toString()}`, { replace: true });
        } else if (responseCode === 'LOGIN_SUCCESS') {
          // Redux에 로그인 정보 저장
          const userData = response.data?.data;
          if (userData) {
            dispatch(
              setLoginSuccess({
                nickname: userData.nickname,
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
          navigate('/', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      } catch {
        navigate('/login', { replace: true });
      }
    };

    handleKakaoCallback();
  }, [dispatch, navigate, searchParams]);

  return <div>카카오 로그인 처리 중입니다...</div>;
};

export default OAuthRedirectHandler;
