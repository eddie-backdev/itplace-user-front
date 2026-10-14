import kakaoLoginImg from '../../../../assets/loginPage/kakao_login.png';

type Props = {
  onClick: () => void;
  disabled?: boolean;
};

const KakaoLoginButton = ({ onClick, disabled = false }: Props) => {
  return (
    <div className="h-[52px] w-full">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label="카카오 계정으로 로그인"
        className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-[#FEE500] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
      >
        <img
          src={kakaoLoginImg.src}
          alt=""
          aria-hidden="true"
          className="h-full w-auto object-contain"
        />
      </button>
    </div>
  );
};

export default KakaoLoginButton;
