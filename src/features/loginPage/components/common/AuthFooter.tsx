type Props = {
  leftText: string;
  rightText: string;
  onRightClick: () => void;
};

const AuthFooter = ({ leftText, rightText, onRightClick }: Props) => {
  return (
    <div className="w-[310px] max-xl:w-[265px] max-lg:w-[199px] max-md:w-full max-sm:w-full flex justify-center gap-[5px] max-xl:gap-[4px] max-lg:gap-[3px] max-md:gap-[4px] max-sm:gap-[4px] text-body-3 max-xl:text-body-4 max-lg:text-body-5 max-md:text-body-4 max-sm:text-body-4 text-grey04 mt-[16px] max-xl:mt-[14px] max-lg:mt-[11px] max-md:mt-[14px] max-sm:mt-[14px] duration-300">
      <span>{leftText}</span>
      <button
        type="button"
        onClick={onRightClick}
        className="bg-transparent text-purple04 hover:text-purple05 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 rounded-sm"
      >
        {rightText}
      </button>
    </div>
  );
};

export default AuthFooter;
