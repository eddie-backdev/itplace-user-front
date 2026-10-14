import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import EmailVerificationBox from '../verification/EmailVerificationBox';
import AuthButton from '../common/AuthButton';
import AuthFooter from '../common/AuthFooter';
import { showToast } from '../../../../utils/toast';

type Props = {
  email: string;
  onChangeEmail: (val: string) => void;
  onGoToLogin: () => void;
  onGoNextStep: (resetToken: string) => void;
};

const FindPasswordStep1 = ({ email, onChangeEmail, onGoToLogin, onGoNextStep }: Props) => {
  const [emailVerified, setEmailVerified] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(
      wrapperRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.out' }
    );
  }, []);

  const handleVerificationComplete = (verified: boolean) => {
    setEmailVerified(verified);
    if (verified) {
      showToast('이메일 인증이 완료되었습니다.', 'success');
    }
  };

  const handleNextClick = () => {
    if (emailVerified && resetToken) {
      onGoNextStep(resetToken);
    }
  };

  return (
    <div ref={wrapperRef} className="flex w-full flex-col items-start">
      <div className="w-full max-w-[400px] text-left">
        <h1 className="text-[28px] font-semibold leading-[1.3] tracking-[-0.035em] text-ink">
          비밀번호를 재설정하세요
        </h1>
        <p className="mt-2 text-[14px] leading-6 text-warmMuted sm:text-[15px]">
          비밀번호를 재설정할 가입 이메일을 입력해주세요.
        </p>
      </div>

      <div className="mt-7 w-full max-w-[400px]">
        <EmailVerificationBox
          email={email}
          onChangeEmail={onChangeEmail}
          onVerifiedChange={handleVerificationComplete}
          mode="reset"
          onResetTokenChange={setResetToken}
        />
      </div>

      <div className="mt-6 w-full max-w-[400px]">
        <AuthButton
          label="다음"
          onClick={handleNextClick}
          variant={emailVerified && resetToken ? 'default' : 'disabled'}
          className="h-[52px] !max-w-[400px]"
        />
      </div>

      <div className="w-full max-w-[400px]">
        <AuthFooter
          leftText="이미 회원이신가요?"
          rightText="로그인 하러 가기"
          onRightClick={onGoToLogin}
        />
      </div>
    </div>
  );
};

export default FindPasswordStep1;
