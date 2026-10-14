import SafeImage from '../../../../../components/SafeImage';
import React from 'react';
import { useSelector } from 'react-redux';
import { TbChevronRight } from 'react-icons/tb';
import { FavoriteBenefit } from '../../../types/api';
import { RootState } from '../../../../../store';
import NoResult from '../../../../../components/NoResult';
import LoadingSpinner from '../../../../../components/LoadingSpinner';

interface FavoriteStoreListProps {
  favorites: FavoriteBenefit[];
  totalFavoritesCount: number;
  onItemClick: (favorite: FavoriteBenefit) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const FavoriteStoreList: React.FC<FavoriteStoreListProps> = ({
  favorites,
  totalFavoritesCount,
  onItemClick,
  isLoading = false,
  error,
  onRetry,
}) => {
  const isLoggedIn = useSelector((state: RootState) => !!state.auth.user);
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 max-md:min-h-56">
        <LoadingSpinner className="h-10 w-10 border-4 border-grey03 border-t-grey05" />
        <p className="mt-4 text-body-4 text-grey04">관심 혜택을 불러오는 중...</p>
      </div>
    );
  }

  // 로그인하지 않은 경우
  if (!isLoggedIn) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 max-md:min-h-56 max-md:mt-4 [&_button]:min-h-11 [&_button]:rounded-lg [&_button]:px-4 [&_button]:focus-visible:ring-[#0066cc] [&_button.bg-purple04]:bg-[#0066cc] [&_button.bg-purple04]:hover:bg-[#0057b8]">
        <NoResult
          message1="로그인이 필요해요!"
          message2="로그인 후 관심 혜택을 이용해 보세요"
          message1FontSize="text-title-6"
          message2FontSize="text-body-3"
          buttonText="로그인하러 가기"
          buttonRoute="/login"
          isLoginRequired={true}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center max-md:min-h-56 [&_button]:min-h-11 [&_button]:rounded-lg [&_button]:px-4 [&_button]:focus-visible:ring-[#0066cc]">
        <NoResult
          variant="error"
          message1="관심 혜택을 불러오지 못했어요"
          message2="잠시 후 다시 시도해 주세요."
          message1FontSize="text-title-6"
          message2FontSize="text-body-3"
          buttonText="다시 시도"
          onButtonClick={onRetry}
        />
      </div>
    );
  }

  // 1. 로그인했지만 즐겨찾기가 없는 경우 2. 즐겨찾기는 있지만 카테고리에 해당하는게 없는 경우
  if (!favorites || favorites.length === 0) {
    const noResultProps =
      totalFavoritesCount === 0
        ? {
            message1: '아직 관심 혜택이 없어요!',
            message2: '마음에 드는 혜택을 담아보세요',
          }
        : {
            message1: '카테고리에 해당하는 혜택이 없어요!',
            message2: '다른 카테고리로 검색해보세요.',
          };

    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 max-md:min-h-56 max-md:mt-4 [&_button]:min-h-11 [&_button]:rounded-lg [&_button]:px-4 [&_button]:focus-visible:ring-[#0066cc] [&_button.bg-purple04]:bg-[#0066cc] [&_button.bg-purple04]:hover:bg-[#0057b8]">
        <NoResult
          {...noResultProps}
          message1FontSize="text-title-6"
          message2FontSize="text-body-3"
          isLoginRequired={false}
        />
      </div>
    );
  }

  return (
    <div className="px-3">
      {favorites.map((favorite) => (
        <button
          type="button"
          key={favorite.benefitId}
          onClick={() => onItemClick(favorite)}
          className="flex min-h-[68px] w-full items-center gap-3 border-b border-[#e6e6e3] px-2 text-left hover:bg-[#f8f8f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0066cc]"
        >
          {/* 왼쪽: 파트너 이미지 */}
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg">
            <SafeImage
              src={favorite.partnerImage}
              alt={`${favorite.partnerName} 로고`}
              fallbackLabel={favorite.partnerName}
              className="h-full w-full object-contain"
              fallbackClassName="bg-[#f1f1ee] text-[#69717e] text-body-4"
            />
          </div>

          {/* 중앙: 파트너 이름 */}
          <div className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold text-[#202120]">
              {favorite.partnerName}
            </span>
          </div>

          {/* 오른쪽: 화살표 */}
          <div className="flex-shrink-0">
            <TbChevronRight
              size={20}
              className="text-grey04 max-md:w-4 max-md:h-4 max-sm:w-3.5 max-sm:h-3.5"
            />
          </div>
        </button>
      ))}
    </div>
  );
};

export default FavoriteStoreList;
