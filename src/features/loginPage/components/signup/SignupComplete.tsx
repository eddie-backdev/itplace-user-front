import styles from './SignupComplete.module.css';

type SignupCompleteProps = {
  isLoggedIn: boolean;
  continuationLabel: string;
  onContinue: () => void;
};

const SignupComplete = ({ isLoggedIn, continuationLabel, onContinue }: SignupCompleteProps) => (
  <section className={styles.complete} aria-label="회원가입 완료">
    <span className={styles.successEmblem} aria-hidden="true">
      <svg viewBox="0 0 32 32" focusable="false">
        <path d="m8 16.5 5.2 5.2L24.5 10" />
      </svg>
    </span>
    <h1 id="signup-flow-heading" tabIndex={-1} className={styles.heading}>
      가입이 완료됐어요
    </h1>
    <p className={styles.message}>
      {isLoggedIn ? (
        <>
          관심 혜택을 저장하고
          <br />
          필요할 때 다시 찾아보세요.
        </>
      ) : (
        '로그인하고 더 많은 정보를 확인하세요.'
      )}
    </p>
    <button type="button" className={styles.continueButton} onClick={onContinue}>
      {isLoggedIn ? continuationLabel : '로그인하기'}
    </button>
  </section>
);

export default SignupComplete;
