import clsx from 'clsx';

type AuthButtonProps = {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'kakao' | 'disabled';
  className?: string;
};

const AuthButton = ({ label, onClick, variant = 'default', className }: AuthButtonProps) => {
  const baseClasses =
    'h-12 w-full max-w-[320px] rounded-xl text-body-2-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed';

  const variantClasses = {
    default: 'bg-brand text-white hover:bg-brandStrong',
    kakao: 'bg-[#FEE500] text-black',
    disabled: 'bg-grey03 text-grey05 cursor-not-allowed',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={variant === 'disabled'}
      className={clsx(baseClasses, variantClasses[variant], className)}
    >
      {label}
    </button>
  );
};

export default AuthButton;
