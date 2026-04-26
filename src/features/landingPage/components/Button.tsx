import { ButtonProps } from '../types/landing.types';

const Button = ({ children, variant = 'primary', onClick }: ButtonProps) => {
  const baseClass =
    'w-[354px] px-20 pt-5 pb-4 rounded-full text-title-4 transition-colors duration-200 max-xl:w-[300px] max-xl:text-title-6 max-sm:w-[280px] max-sm:text-title-7';

  const variants = {
    primary: 'bg-purple04 text-white hover:bg-purple05',
    outline:
      'border-2 border-purple04 text-purple05 bg-white hover:bg-purple05 hover:text-white hover:border-purple05',
  };

  return (
    <button
      className={`${baseClass} ${variants[variant]} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
