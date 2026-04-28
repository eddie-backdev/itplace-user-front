type Props = {
  onGoToSignUp: () => void;
  onGoToFindPassword: () => void;
};

const AuthLinkRow = ({ onGoToSignUp, onGoToFindPassword }: Props) => {
  return (
    <div className="w-[310px] max-xl:w-[265px] max-lg:w-[199px] max-md:w-full max-sm:w-full flex justify-between text-body-3 max-xl:text-body-4 max-lg:text-body-5 max-md:text-body-4 max-sm:text-body-4 text-grey03 mt-[12px] max-xl:mt-[10px] max-lg:mt-[8px] max-md:mt-[10px] max-sm:mt-[10px] duration-150">
      <button
        type="button"
        onClick={onGoToSignUp}
        className="bg-transparent text-purple04 hover:text-purple05 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 rounded-sm"
      >
        계정이 없으신가요?
      </button>
      <button
        type="button"
        onClick={onGoToFindPassword}
        className="bg-transparent hover:text-grey04 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 rounded-sm"
      >
        비밀번호 찾기
      </button>
    </div>
  );
};

export default AuthLinkRow;
