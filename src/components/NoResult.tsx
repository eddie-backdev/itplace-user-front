import React from 'react';
import { useNavigate } from 'react-router-dom';

// props 타입 정의
// message1: 상단 제목
// message2: 하단 설명
// buttonText: 버튼 문구 (없으면 버튼 안보임)
// buttonRoute: 버튼 클릭 시 이동할 경로 (없으면 버튼 안보임)
// isLoginRequired: 로그인 토끼 이미지 분기를 위한 로그인 여부

// Props 타입 지정
type NoResultProps = {
  message1?: string;
  message2?: string;
  buttonText?: string;
  buttonRoute?: string;
  onButtonClick?: () => void;
  secondaryButtonText?: string;
  secondaryButtonRoute?: string;
  onSecondaryButtonClick?: () => void;
  isLoginRequired?: boolean;
  variant?: 'empty' | 'error' | 'blocked';
  message1FontSize?: string;
  message2FontSize?: string;
};

const NoResult: React.FC<NoResultProps> = ({
  message1 = '앗! 일치하는 결과를 찾을 수 없어요!',
  message2 = '다른 키워드나 조건으로 다시 찾아보세요.',
  buttonText,
  buttonRoute,
  onButtonClick,
  secondaryButtonText,
  secondaryButtonRoute,
  onSecondaryButtonClick,
  isLoginRequired = false,
  variant = 'empty',
  message1FontSize = 'text-title-4',
  message2FontSize = 'text-body-1',
}) => {
  const navigate = useNavigate();

  const handlePrimaryClick = () => {
    if (onButtonClick) {
      onButtonClick();
      return;
    }

    if (buttonRoute) {
      navigate(buttonRoute);
    }
  };

  const handleSecondaryClick = () => {
    if (onSecondaryButtonClick) {
      onSecondaryButtonClick();
      return;
    }

    if (secondaryButtonRoute) {
      navigate(secondaryButtonRoute);
    }
  };

  const isBlocked = variant === 'blocked' || isLoginRequired;
  const imageWebp = isBlocked ? '/images/bunny-login-require.webp' : '/images/bunny-no-result.webp';
  const imagePng = isBlocked ? '/images/bunny-login-require.png' : '/images/bunny-no-result.png';

  return (
    <div
      className="flex flex-col items-center justify-center p-6 text-center"
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <picture>
        <source srcSet={imageWebp} type="image/webp" />
        <img
          src={imagePng}
          alt={isBlocked ? 'login-required' : variant}
          className="w-36 h-auto mb-4 max-xl:w-28"
        />
      </picture>

      <h2 className={`${message1FontSize} text-grey06 mb-2`}>{message1}</h2>
      <p className={`${message2FontSize} text-grey05 mb-4 whitespace-pre-line`}>{message2}</p>

      {(buttonText || secondaryButtonText) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {secondaryButtonText && (
            <button
              type="button"
              onClick={handleSecondaryClick}
              className="px-7 py-2.5 rounded-full border border-grey02 bg-white text-grey05 text-body-3 transition-colors hover:bg-grey01 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 max-xl:text-body-4 max-md:text-body-5"
            >
              {secondaryButtonText}
            </button>
          )}
          {buttonText && (
            <button
              type="button"
              onClick={handlePrimaryClick}
              className="px-9 py-2.5 rounded-full bg-purple04 text-white text-body-3 transition-colors hover:bg-purple05 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 max-xl:text-body-4 max-md:text-body-5"
            >
              {buttonText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NoResult;
