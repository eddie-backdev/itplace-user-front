import { MdArrowBack } from 'react-icons/md';
import styles from './AuthPageLayout.module.css';

type SignupFlowHeaderProps = {
  step: 1 | 2 | 3 | null;
  heading: string;
  description?: string;
  onBack?: () => void;
};

const steps = [
  { number: 1, label: '계정 정보' },
  { number: 2, label: '회원 정보' },
  { number: 3, label: '가입 완료' },
] as const;

const SignupFlowHeader = ({ step, heading, description, onBack }: SignupFlowHeaderProps) => (
  <header
    className={`${styles.signupHeader} ${step === 2 ? styles.signupHeaderCompact : ''} ${step === 3 ? styles.signupHeaderComplete : ''}`}
  >
    <div className={styles.signupUtility}>
      <span aria-hidden="true" className={styles.signupUtilitySpacer} />
    </div>

    {step ? (
      <ol aria-label="회원가입 진행 단계" className={styles.signupProgress}>
        {steps.map(({ number, label }) => {
          const isCurrent = number === step;
          const isComplete = number < step;

          return (
            <li
              key={number}
              aria-current={isCurrent ? 'step' : undefined}
              className={`${styles.signupStep} ${
                isCurrent
                  ? styles.signupStepCurrent
                  : isComplete
                    ? styles.signupStepComplete
                    : styles.signupStepUpcoming
              }`}
            >
              <span className={styles.signupStepNumber} aria-hidden="true">
                {isComplete ? '✓' : number}
              </span>
              <span>{label}</span>
            </li>
          );
        })}
      </ol>
    ) : null}

    {step !== 3 ? (
      <div className={styles.signupTitleBlock}>
        {step === 2 && onBack ? (
          <button
            type="button"
            onClick={onBack}
            className={`${styles.signupUtilityButton} ${styles.signupBackButton}`}
          >
            <MdArrowBack aria-hidden="true" />
            이전 단계
          </button>
        ) : null}
        <h1
          id="signup-flow-heading"
          tabIndex={-1}
          className={`${styles.signupHeading} ${step === 2 && onBack ? styles.signupHeadingWithBack : ''}`}
        >
          {heading}
        </h1>
        {description ? <p className={styles.signupDescription}>{description}</p> : null}
      </div>
    ) : null}
  </header>
);

export default SignupFlowHeader;
