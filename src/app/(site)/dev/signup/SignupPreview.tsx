'use client';

import { useState } from 'react';
import SignUpAccountForm from '@/features/loginPage/components/signup/SignUpAccountForm';
import SignUpFinalForm from '@/features/loginPage/components/signup/SignUpFinalForm';
import SignupComplete from '@/features/loginPage/components/signup/SignupComplete';
import SignupFlowHeader from '@/features/loginPage/layouts/SignupFlowHeader';
import styles from '@/features/loginPage/layouts/AuthPageLayout.module.css';
import { useNavigate } from '@/lib/navigation';

type PreviewStep = 1 | 2 | 3;

type SignupPreviewProps = {
  cleanScreen?: boolean;
  initialStep?: PreviewStep;
};

const steps: Record<PreviewStep, string> = { 1: '계정 정보', 2: '회원 정보', 3: '가입 완료' };

const SignupPreview = ({ cleanScreen = false, initialStep = 1 }: SignupPreviewProps) => {
  const [step, setStep] = useState<PreviewStep>(initialStep);
  const navigate = useNavigate();
  const changeStep = (nextStep: PreviewStep) => {
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'instant' });
    requestAnimationFrame(() => {
      document.getElementById('signup-flow-heading')?.focus({ preventScroll: true });
    });
  };

  return (
    <>
      <div className={`${styles.page} ${styles.signupPage}`}>
        <div className={`${styles.surface} ${styles.signupSurface}`}>
          <div className={styles.formSide}>
            <section className={`${styles.formCard} ${styles.signupCard}`}>
              <SignupFlowHeader
                step={step}
                heading={steps[step]}
                description={step === 1 ? '로그인에 사용할 이메일을 인증해 주세요.' : undefined}
                onBack={step === 2 ? () => changeStep(1) : undefined}
              />
              {step === 1 ? (
                <div inert>
                  <SignUpAccountForm
                    onEmailVerifiedChange={() => {}}
                    onValuesChange={() => {}}
                    onNext={() => {}}
                  />
                </div>
              ) : step === 2 ? (
                <SignUpFinalForm
                  onComplete={() => {}}
                  onEmailVerificationExpired={() => {}}
                  onValuesChange={() => {}}
                  email=""
                  password=""
                  passwordConfirm=""
                />
              ) : (
                <SignupComplete
                  isLoggedIn={false}
                  continuationLabel="계속하기"
                  onContinue={() => navigate('/login')}
                />
              )}
            </section>
          </div>
        </div>
      </div>

      {!cleanScreen && (
        <nav
          aria-label="개발용 가입 화면 미리보기"
          className="fixed bottom-[max(12px,env(safe-area-inset-bottom))] right-3 z-50 flex max-w-[calc(100vw-24px)] items-center gap-2 rounded-xl border border-[#e8e9ee] bg-white/95 p-2 shadow-lg backdrop-blur sm:right-6"
        >
          <div className="mr-1 min-w-[60px] whitespace-nowrap text-[10px] leading-3 text-[#686b73] sm:min-w-[118px] sm:text-xs sm:leading-4">
            <span className="block font-semibold text-[#34343b]">화면 미리보기</span>
            <span className="hidden sm:block">
              {step === 1 ? '입력 없이 화면만 확인' : '가입 단계 확인'}
            </span>
          </div>
          <span className="min-w-8 shrink-0 text-center text-xs font-medium text-[#34343b] sm:min-w-[74px] sm:text-sm">
            <span className="sm:hidden">{step}/3</span>
            <span className="hidden sm:inline">
              {steps[step]} · {step}/3
            </span>
          </span>
          {step > 1 && (
            <button
              type="button"
              onClick={() => changeStep((step - 1) as PreviewStep)}
              className="min-h-11 min-w-11 shrink-0 whitespace-nowrap rounded-lg px-2 text-sm font-semibold text-[#34343b] hover:bg-[#f7f8fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6154d9] sm:px-3"
            >
              이전
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={() => changeStep((step + 1) as PreviewStep)}
              className="min-h-11 min-w-11 shrink-0 whitespace-nowrap rounded-lg bg-[#6154d9] px-2 text-sm font-semibold text-white hover:bg-[#5145c7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6154d9] sm:px-3"
            >
              다음
            </button>
          ) : (
            <button
              type="button"
              onClick={() => changeStep(1)}
              className="min-h-11 min-w-11 shrink-0 whitespace-nowrap rounded-lg bg-[#6154d9] px-2 text-sm font-semibold text-white hover:bg-[#5145c7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6154d9] sm:px-3"
            >
              처음으로
            </button>
          )}
        </nav>
      )}
    </>
  );
};

export default SignupPreview;
