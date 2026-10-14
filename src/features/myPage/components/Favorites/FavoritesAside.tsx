import FadeWrapper from '../FadeWrapper';
import BenefitDetailTabs from './BenefitDetailTabs';
import { FavoriteItem } from '../../../../types/favorites';
import LoadingSpinner from '../../../../components/LoadingSpinner';

interface FavoritesAsideProps {
  favorites: FavoriteItem[];
  isEditing: boolean;
  selectedItems: number[];
  selectedId: number | null;
  userCarrier?: string | null;
  userGrade?: string | null;
  loading: boolean;
}

export default function FavoritesAside({
  favorites,
  isEditing,
  selectedItems,
  selectedId,
  userCarrier,
  userGrade,
  loading,
}: FavoritesAsideProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner />
      </div>
    );
  }
  if (favorites.length === 0) return null;

  // 편집 모드일 때
  if (isEditing) {
    return (
      <FadeWrapper changeKey={selectedItems.length}>
        <h2 className="text-title-4 font-semibold text-ink mb-4 text-center max-xlg:text-left">
          선택한 혜택
        </h2>
        <div className="flex flex-col max-lg:flex-row items-center justify-center mt-7">
          <img
            src="/images/myPage/icon-file.webp"
            alt="폴더"
            className="w-[185px] h-auto max-xl:w-[160px] max-xlg:w-[140px] max-lg:w-[100px] max-lg:mr-6"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null; // 무한 루프 방지
              target.src = '/images/myPage/icon-file.png';
            }}
          />
          <div className="flex justify-center items-baseline">
            <p className="text-[96px] font-bold text-orange04 mt-3 max-xl:text-[76px]">
              {selectedItems.length}
            </p>
            <p className="text-title-1 text-grey05 ml-2 max-xl:text-title-2">개</p>
          </div>
        </div>
      </FadeWrapper>
    );
  }

  // 상세 혜택 표시 모드
  return (
    <FadeWrapper changeKey={selectedId}>
      {selectedId ? (
        <>
          <h2 className="text-title-4 font-semibold text-ink mb-4 text-center max-xlg:text-left">
            상세 혜택
          </h2>
          <BenefitDetailTabs
            benefitId={selectedId}
            image={favorites.find((f) => f.benefitId === selectedId)?.partnerImage ?? ''}
            name={favorites.find((f) => f.benefitId === selectedId)?.benefitName ?? ''}
            userCarrier={userCarrier}
            userGrade={userGrade}
          />
        </>
      ) : (
        <p className="text-grey05">카드를 선택하면 상세 혜택이 표시됩니다.</p>
      )}
    </FadeWrapper>
  );
}
