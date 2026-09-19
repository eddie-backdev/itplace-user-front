import kakaoLoginImg from '../../../../assets/loginPage/kakao_login.png';

type Props = {
  onClick: () => void;
};

const KakaoLoginButton = ({ onClick }: Props) => {
  return (
    <div className="w-[320px] max-xl:w-[274px] max-lg:w-[205px] max-md:w-full max-sm:w-full h-[53px] max-xl:h-[40px] max-lg:h-[30px] max-md:h-[48px] max-sm:h-[48px] bg-[#FEE500] rounded-[18px] max-xl:rounded-[15px] max-lg:rounded-[12px] max-md:rounded-[16px] max-sm:rounded-[16px] flex items-center justify-center">
      <button onClick={onClick}>
        <img src={kakaoLoginImg.src} alt="카카오 로그인" className="w-full h-full object-cover" />
      </button>
    </div>
  );
};

export default KakaoLoginButton;
