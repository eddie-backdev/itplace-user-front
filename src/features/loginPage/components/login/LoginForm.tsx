import { useRef, useState, type FormEvent } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setLoginSuccess } from '../../../../store/authSlice';
import { showToast } from '../../../../utils/toast';
import { login } from '../../apis/auth';
import AuthInput from '../common/AuthInput';
import AuthLinkRow from '../common/AuthLinkRow';
import AuthDivider from '../common/AuthDivider';
import KakaoLoginButton from './KakaoLoginButton';
import { useNavigate } from '@/lib/navigation';
import { clearOAuthReturnTo, getSafeReturnTo, storeOAuthReturnTo } from '../../utils/returnTo.mjs';

type Props = {
  onGoToSignUp: () => void;
  onGoToFindPassword: () => void;
  returnTo: string;
};

const LoginForm = ({ onGoToSignUp, onGoToFindPassword, returnTo }: Props) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const submissionInProgress = useRef(false);

  const handleLogin = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (submissionInProgress.current) return;
    try {
      submissionInProgress.current = true;
      setIsSubmitting(true);
      setLoginError('');
      const response = await login(email, password);
      const { code, data } = response.data;

      if (code === 'LOGIN_SUCCESS') {
        dispatch(setLoginSuccess(data));
        showToast('로그인에 성공하셨습니다!', 'success');
        clearOAuthReturnTo();
        navigate(getSafeReturnTo(returnTo), { replace: true });
      } else {
        setLoginError('이메일 또는 비밀번호를 확인해주세요.');
      }
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      setLoginError(
        status === 401
          ? '이메일 또는 비밀번호를 확인해주세요.'
          : status === 429
            ? '로그인 시도가 많습니다. 잠시 후 다시 시도해주세요.'
            : '지금 로그인할 수 없습니다. 잠시 후 다시 시도해주세요.'
      );
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  };

  const handleKakaoLogin = () => {
    if (submissionInProgress.current) return;
    const kakaoLoginUrl = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
    if (!kakaoLoginUrl) {
      showToast('카카오 로그인 설정을 확인해주세요', 'error');
      return;
    }
    if (!storeOAuthReturnTo(returnTo)) {
      showToast('로그인 정보를 저장할 수 없어 카카오 로그인을 시작하지 못했습니다.', 'error');
      return;
    }
    window.location.href = kakaoLoginUrl;
  };

  return (
    <div className="mx-auto w-full max-w-[400px]">
      <div className="mb-7 text-left">
        <h1 className="text-[30px] font-bold leading-9 text-grey07 max-sm:text-[28px]">로그인</h1>
        <p className="mt-2 max-w-[34ch] text-body-3 leading-6 text-grey05">
          관심 혜택과 사용 기록을 이어서 확인하세요.
        </p>
      </div>

      <form
        className="flex w-full flex-col items-stretch"
        onSubmit={handleLogin}
        aria-busy={isSubmitting}
      >
        <div className="mb-4 w-full">
          <AuthInput
            name="email"
            type="email"
            label="이메일"
            placeholder="이메일"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            ariaInvalid={!!loginError}
            ariaDescribedBy={loginError ? 'login-error' : undefined}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setLoginError('');
            }}
            className="h-[52px] max-w-none"
          />
        </div>

        <div className="mb-5 w-full">
          <div className="mb-1.5 flex min-h-6 items-center justify-between gap-2">
            <label htmlFor="auth-password" className="text-body-3 font-semibold text-grey06">
              비밀번호
            </label>
            <button
              type="button"
              onClick={onGoToFindPassword}
              className="min-h-11 rounded-sm px-1 text-body-3 text-grey05 hover:text-grey07 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              비밀번호 찾기
            </button>
          </div>
          <div className="relative">
            <AuthInput
              name="password"
              type={showPassword ? 'text' : 'password'}
              label=""
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
              required
              ariaInvalid={!!loginError}
              ariaDescribedBy={loginError ? 'login-error' : undefined}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLoginError('');
              }}
              disableFocusEffect
              className="h-[52px] max-w-none pr-16"
            />
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              aria-pressed={showPassword}
              className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg px-2 text-body-4 font-medium text-grey05 hover:text-grey07 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {showPassword ? '숨기기' : '표시'}
            </button>
          </div>
        </div>

        {loginError && (
          <p id="login-error" role="alert" className="-mt-2 mb-3 text-body-3 text-danger">
            {loginError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-[52px] w-full rounded-xl bg-brand text-body-2-bold text-white transition-colors hover:bg-brandStrong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
        >
          {isSubmitting ? '로그인 중…' : '로그인'}
        </button>

        <AuthDivider className="my-6" label="또는" />
        <KakaoLoginButton onClick={handleKakaoLogin} disabled={isSubmitting} />

        <AuthLinkRow onGoToSignUp={onGoToSignUp} />
      </form>
    </div>
  );
};

export default LoginForm;
