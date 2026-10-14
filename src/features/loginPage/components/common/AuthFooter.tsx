type Props = {
  leftText: string;
  rightText: string;
  onRightClick: () => void;
};

const AuthFooter = ({ leftText, rightText, onRightClick }: Props) => {
  return (
    <div className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 text-body-3 text-grey05">
      <span>{leftText}</span>
      <button
        type="button"
        onClick={onRightClick}
        className="min-h-11 rounded-sm bg-transparent px-1 text-brand hover:text-brandStrong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {rightText}
      </button>
    </div>
  );
};

export default AuthFooter;
