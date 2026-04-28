import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setLoginSuccess } from '../../../../store/authSlice';
import { showToast } from '../../../../utils/toast';
import { login } from '../../apis/auth';
import AuthInput from '../common/AuthInput';
import AuthButton from '../common/AuthButton';
import AuthLinkRow from '../common/AuthLinkRow';
import AuthDivider from '../common/AuthDivider';
import KakaoLoginButton from './KakaoLoginButton';
import { useNavigate } from 'react-router-dom';

type Props = {
  onGoToSignUp: () => void;
  onGoToFindPassword: () => void;
};

const LoginForm = ({ onGoToSignUp, onGoToFindPassword }: Props) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('이메일 및 비밀번호를 입력해주세요', 'error');
      return;
    }

    try {
      const response = await login(email, password);
      const { code, data } = response.data;

      if (code === 'LOGIN_SUCCESS') {
        dispatch(setLoginSuccess(data));
        showToast('로그인에 성공하셨습니다!', 'success');
        navigate('/main');
      } else {
        showToast('로그인에 실패하셨습니다.', 'error');
      }
    } catch {
      showToast('로그인에 실패하셨습니다.', 'error');
    }
  };

  const handleKakaoLogin = () => {
    const kakaoLoginUrl = import.meta.env.VITE_KAKAO_REDIRECT_URI;
    window.location.href = kakaoLoginUrl;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div>
      <h2 className="text-title-1 max-xl:text-title-2 max-lg:text-title-3 max-md:text-title-2 max-sm:text-title-4 max-sm:font-semibold mb-[40px] max-xl:mb-[34px] max-lg:mb-[27px] max-md:mb-[32px] max-sm:mb-[32px]">
        로그인
      </h2>

      <div className="flex flex-col gap-0 w-full items-center">
        <div className="mb-[20px] max-md:mb-[16px] max-sm:mb-[16px] w-full">
          <AuthInput
            name="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="mb-[40px] max-md:mb-[32px] max-sm:mb-[32px] w-full">
          <AuthInput
            name="password"
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <AuthButton label="로그인" onClick={handleLogin} />

        <AuthLinkRow onGoToSignUp={onGoToSignUp} onGoToFindPassword={onGoToFindPassword} />
        <AuthDivider />
        <KakaoLoginButton onClick={handleKakaoLogin} />
      </div>
    </div>
  );
};

export default LoginForm;
