import { ReactNode } from 'react';

export type RadiusOption = 'all' | 'right' | 'left' | 'none';

type Props = {
  children: ReactNode;
  radius?: RadiusOption;
  variant?: 'default' | 'signup';
};

const getRadiusClass = (radius: RadiusOption) => {
  switch (radius) {
    case 'right':
      return 'rounded-tr-[30px] max-xl:rounded-tr-[26px] max-lg:rounded-tr-[20px] max-md:rounded-tr-[18px] max-sm:rounded-tr-[16px] rounded-br-[30px] max-xl:rounded-br-[26px] max-lg:rounded-br-[20px] max-md:rounded-br-[18px] max-sm:rounded-br-[16px]';
    case 'left':
      return 'rounded-tl-[30px] max-xl:rounded-tl-[26px] max-lg:rounded-tl-[20px] max-md:rounded-tl-[18px] max-sm:rounded-tl-[16px] rounded-bl-[30px] max-xl:rounded-bl-[26px] max-lg:rounded-bl-[20px] max-md:rounded-bl-[18px] max-sm:rounded-bl-[16px]';
    case 'none':
      return 'rounded-none';
    case 'all':
    default:
      return 'rounded-[30px] max-xl:rounded-[26px] max-lg:rounded-[20px] max-md:rounded-[18px] max-sm:rounded-[16px]';
  }
};

const AuthFormCard = ({ children, radius = 'all', variant = 'default' }: Props) => {
  const radiusClass = getRadiusClass(radius);
  const isSignup = variant === 'signup';
  const sizeClass = isSignup
    ? 'w-full max-w-[620px] max-xl:max-w-[560px] max-lg:max-w-[500px] px-10 py-9 max-xl:px-9 max-xl:py-8 max-lg:px-8 max-lg:py-7'
    : 'w-[583px] max-xl:w-[500px] max-lg:w-[375px] max-md:w-full max-sm:w-full h-[639px] max-xl:h-[548px] max-lg:h-[430px] max-md:h-auto max-sm:h-auto';
  const layoutClass = isSignup ? 'items-center justify-start' : 'items-center justify-center';
  const visualClass = isSignup
    ? 'relative border border-white/80 bg-white/[0.96] shadow-[0_24px_60px_rgba(16,17,20,0.12)] backdrop-blur-sm before:absolute before:inset-x-10 before:top-0 before:h-[3px] before:rounded-full before:bg-gradient-to-r before:from-purple02 before:via-purple04 before:to-purple05'
    : 'bg-white drop-shadow-basic';

  return (
    <div className={`${sizeClass} ${visualClass} flex flex-col ${layoutClass} ${radiusClass}`}>
      {children}
    </div>
  );
};

export default AuthFormCard;
