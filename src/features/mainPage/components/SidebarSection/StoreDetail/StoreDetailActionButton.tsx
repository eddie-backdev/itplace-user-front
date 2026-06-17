import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { TbStar, TbStarFilled } from 'react-icons/tb';
import { RootState } from '../../../../../store';
import { addFavorite, removeFavorite } from '../../../api/favoriteApi';
import { showToast } from '../../../../../utils/toast';
import { actionAnimations } from '../../../../../utils/Animation';

interface StoreDetailActionButtonProps {
  benefitId?: string;
  isFavorite: boolean;
  onFavoriteChange: (newIsFavorite: boolean) => void;
  isDetailRefreshing?: boolean;
}

const StoreDetailActionButton: React.FC<StoreDetailActionButtonProps> = ({
  benefitId,
  isFavorite,
  onFavoriteChange,
  isDetailRefreshing = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const favoriteButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);

  const handleFavoriteToggle = async () => {
    if (!isLoggedIn) {
      showToast('로그인이 필요한 서비스입니다.', 'error');
      return;
    }

    if (!benefitId) {
      showToast('혜택 정보가 없어 관심 혜택으로 추가할 수 없습니다.', 'error');
      return;
    }

    if (isDetailRefreshing) {
      showToast('선택한 통신사 혜택 정보를 확인 중입니다.', 'info');
      return;
    }

    if (favoriteButtonRef.current) {
      actionAnimations.clickScale(favoriteButtonRef.current);
    }

    setIsLoading(true);
    try {
      const benefitIdNumber = parseInt(benefitId);

      if (isFavorite) {
        const response = await removeFavorite([benefitIdNumber]);
        showToast(response.message, 'info');
        onFavoriteChange(false);
      } else {
        const response = await addFavorite(benefitIdNumber);
        showToast(response.message, 'success');
        onFavoriteChange(true);
      }
    } catch (error: unknown) {
      console.error('즐겨찾기 토글 실패:', error);

      const isAxiosError = (
        err: unknown
      ): err is { response?: { data?: { message?: string } } } => {
        return typeof err === 'object' && err !== null && 'response' in err;
      };

      if (isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        if (errorMessage) {
          showToast(errorMessage, 'error');
          return;
        }
      }

      showToast(
        isFavorite ? '관심 혜택 삭제에 실패했습니다.' : '관심 혜택 추가에 실패했습니다.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = !isLoggedIn || !benefitId || isLoading || isDetailRefreshing;
  const Icon = isFavorite ? TbStarFilled : TbStar;

  const buttonText = isDetailRefreshing
    ? '혜택 정보를 확인 중이에요'
    : !isLoggedIn
      ? '로그인이 필요해요'
      : !benefitId
        ? '혜택 정보가 없어요'
        : isFavorite
          ? '관심 혜택 해제하기'
          : '관심 혜택 추가하기';

  return (
    <button
      ref={favoriteButtonRef}
      type="button"
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-lg text-body-3-bold transition-colors max-xl:h-11 md:h-14 md:text-body-2-bold ${
        isDisabled
          ? 'cursor-not-allowed bg-grey03 text-grey04'
          : isFavorite
            ? 'bg-purple01 text-purple05 hover:bg-purple02/80'
            : 'bg-purple04 text-white hover:bg-purple05'
      }`}
      onClick={handleFavoriteToggle}
      disabled={isDisabled}
    >
      <Icon className="h-5 w-5 md:h-6 md:w-6" />
      <span>{buttonText}</span>
    </button>
  );
};

export default StoreDetailActionButton;
