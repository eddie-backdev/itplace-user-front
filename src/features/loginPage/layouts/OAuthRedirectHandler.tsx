import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from '@/lib/navigation';
import { useDispatch } from 'react-redux';
import { setLoginSuccess } from '../../../store/authSlice';
import { kakaoOAuthLogin } from '../apis/auth';
import { showToast } from '../../../utils/toast';
import { storeOAuthPreAuth } from '../utils/oauthPreAuthStorage';
import { consumeOAuthReturnTo } from '../utils/returnTo.mjs';

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
        navigate('/login', { replace: true, preserveLoginIntent: true });
        return;
      }

      if (!code) {
        navigate('/login', { replace: true, preserveLoginIntent: true });
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
          navigate(consumeOAuthReturnTo(), { replace: true });
        } else {
          navigate('/login', { replace: true, preserveLoginIntent: true });
        }
      } catch {
        navigate('/login', { replace: true, preserveLoginIntent: true });
      }
    };

    handleKakaoCallback();
  }, [dispatch, navigate, searchParams]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-warmCanvas px-5 text-center">
      <section className="w-full max-w-[440px] rounded-3xl border border-warmBorder bg-white px-8 py-12">
        <h1 className="text-title-6 font-bold text-grey07">카카오 로그인 처리 중입니다</h1>
        <p className="mt-2 text-body-3 leading-6 text-grey05">
          계정 정보를 확인하고 있어요. 잠시만 기다려 주세요.
        </p>
      </section>
    </main>
  );
};

export default OAuthRedirectHandler;
