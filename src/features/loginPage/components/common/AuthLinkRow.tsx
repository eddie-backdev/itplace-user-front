type Props = {
  onGoToSignUp: () => void;
};

const AuthLinkRow = ({ onGoToSignUp }: Props) => {
  return (
    <p className="mt-5 flex min-h-11 w-full items-center justify-center gap-1.5 text-body-3 text-grey05">
      <span>아직 계정이 없나요?</span>
      <button
        type="button"
        onClick={onGoToSignUp}
        className="min-h-11 rounded-sm px-1 font-semibold text-accent hover:text-accentStrong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        회원가입
      </button>
    </p>
  );
};

export default AuthLinkRow;
