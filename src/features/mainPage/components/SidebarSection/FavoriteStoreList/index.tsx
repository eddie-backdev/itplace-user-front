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
}

const FavoriteStoreList: React.FC<FavoriteStoreListProps> = ({
  favorites,
  totalFavoritesCount,
  onItemClick,
  isLoading = false,
}) => {
  const isLoggedIn = useSelector((state: RootState) => !!state.auth.user);
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 max-md:min-h-56">
        <LoadingSpinner className="h-12 w-12 border-4 border-purple04 border-t-transparent" />
        <p className="mt-4 text-body-4 text-grey04">관심 혜택을 불러오는 중...</p>
      </div>
    );
  }

  // 로그인하지 않은 경우
  if (!isLoggedIn) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 max-md:min-h-56 max-md:mt-4">
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
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 max-md:min-h-56 max-md:mt-4">
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
    <div className="space-y-3 max-md:space-y-3 px-5 max-md:px-4 max-sm:px-3">
      {favorites.map((favorite) => (
        <div
          key={favorite.benefitId}
          onClick={() => onItemClick(favorite)}
          className="w-[330px] h-[60px] bg-grey01 rounded-[10px] px-4 flex items-center cursor-pointer hover:bg-purple01 transition-colors overflow-x-hidden max-md:w-auto max-md:h-[50px] max-md:px-3 max-sm:h-[64px] max-sm:px-2"
        >
          {/* 왼쪽: 파트너 이미지 */}
          <div className="w-[50px] h-[50px] rounded-[10px] overflow-hidden flex-shrink-0 mr-6 max-md:w-[40px] max-md:h-[40px] max-md:mr-4 max-sm:w-[35px] max-sm:h-[35px] max-sm:mr-3 bg-white">
            <SafeImage
              src={favorite.partnerImage}
              alt={`${favorite.partnerName} 로고`}
              fallbackLabel={favorite.partnerName}
              className="w-full h-full object-contain"
              fallbackClassName="bg-purple04 text-white text-body-4 max-md:text-body-5 max-sm:text-body-6"
            />
          </div>

          {/* 중앙: 파트너 이름 */}
          <div className="flex-1">
            <span className="text-body-3-bold text-grey06 max-md:text-body-4-bold">
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
        </div>
      ))}
    </div>
  );
};

export default FavoriteStoreList;
