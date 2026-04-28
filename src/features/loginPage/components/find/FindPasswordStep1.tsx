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
    <div ref={wrapperRef} className="w-full flex flex-col">
      <div className="w-[320px] max-xl:w-[274px] max-lg:w-[205px] max-md:w-full max-sm:w-full mx-auto">
        <p className="text-title-5 max-xl:text-title-6 max-lg:text-title-7 max-md:text-title-6 max-sm:text-title-6 text-grey05 mt-[16px] max-md:mt-[12px] max-sm:mt-[12px]">
          비밀번호를 재설정할 <strong>가입 이메일</strong>을 입력해주세요.
        </p>
      </div>

      <div className="mt-[20px] max-xl:mt-[17px] max-lg:mt-[13px] max-md:mt-[16px] max-sm:mt-[16px] w-full flex justify-center">
        <EmailVerificationBox
          email={email}
          onChangeEmail={onChangeEmail}
          onVerifiedChange={handleVerificationComplete}
          mode="reset"
          onResetTokenChange={setResetToken}
        />
      </div>

      <div className="flex justify-center">
        <AuthButton
          label="다음"
          onClick={handleNextClick}
          variant={emailVerified && resetToken ? 'default' : 'disabled'}
          className="mt-[150px] max-xl:mt-[130px] max-lg:mt-[100px] max-md:mt-[60px] max-sm:mt-[60px]"
        />
      </div>

      <div className="mt-[8px] max-md:mt-[6px] max-sm:mt-[8px] w-full flex justify-center">
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
