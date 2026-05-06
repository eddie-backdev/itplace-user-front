// src/features/myPage/components/BenefitCardList.tsx
import SafeImage from '../../../../components/SafeImage';
import { TbStarFilled } from 'react-icons/tb';
import { FavoriteItem } from '../../../../types/favorites';

interface BenefitCardListProps {
  items: FavoriteItem[]; // 현재 페이지에 보여줄 아이템들
  selectedId: number | null;
  setSelectedId: (id: number) => void;

  isEditing: boolean;
  selectedItems: number[];
  setSelectedItems: (ids: number[]) => void;

  onRemove: (id: number) => void; // 단일 삭제
  onRequestDelete: (id: number) => void; // 모달 열기용 (단일)
}

/**
 * 카드 리스트를 렌더링하는 컴포넌트
 * 👉 MyFavoritesPage에서 상태/로직을 props로 내려서 사용
 */
export default function BenefitCardList({
  items,
  selectedId,
  setSelectedId,
  isEditing,
  selectedItems,
  setSelectedItems,
  onRequestDelete,
}: BenefitCardListProps) {
  // 체크박스 토글 함수
  const toggleSelect = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4 min-h-[360px] max-xl:min-h-[300px] max-md:gap-3">
      {items.map((item) => (
        <div
          key={item.benefitId}
          role="button"
          tabIndex={0}
          aria-label={`${item.benefitName} 상세 보기`}
          onClick={() => {
            if (isEditing) {
              toggleSelect(item.benefitId);
            } else {
              setSelectedId(item.benefitId); // 상세보기
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              if (isEditing) {
                toggleSelect(item.benefitId);
              } else {
                setSelectedId(item.benefitId);
              }
            }
          }}
          className={`relative p-4 border flex flex-col items-center rounded-[22px] aspect-[16/11] w-full max-xl:aspect-[16/10] max-md:max-h-none max-md:aspect-[4/3] max-sm:aspect-[12/13] cursor-pointer border-none bg-white shadow-[0_10px_28px_rgba(37,9,97,0.10)] transition hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(37,9,97,0.16)] ${
            isEditing
              ? selectedItems.includes(item.benefitId)
                ? 'ring-2 ring-purple04 bg-purple01/30'
                : ''
              : selectedId === item.benefitId
                ? 'ring-2 ring-purple04 bg-purple01/30'
                : ''
          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02`}
        >
          {/* 편집 모드일 때 체크박스 표시 */}
          {isEditing && (
            <input
              type="checkbox"
              checked={selectedItems.includes(item.benefitId)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedItems([...selectedItems, item.benefitId]);
                } else {
                  setSelectedItems(selectedItems.filter((id) => id !== item.benefitId));
                }
              }}
              className="absolute top-5 right-5 w-5 h-5 max-xl:w-4 max-xl:h-4 accent-purple04 appearance-none rounded-md max-xl:rounded-[4px] border border-grey03 bg-white checked:bg-[url('/images/myPage/icon-check.png')] bg-no-repeat bg-center checked:border-purple04"
            />
          )}

          {/* 즐겨찾기 해제 버튼 (편집 모드 아닐 때만 표시) */}
          {!isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete(item.benefitId); // 모달 열기
              }}
              className="absolute top-5 right-5 max-xl:top-4 max-xl:right-4 rounded-full bg-orange01 p-1 text-orange04 hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
              title="즐겨찾기 해제"
            >
              <TbStarFilled size={20} />
            </button>
          )}

          {/* 카드 이미지 및 제목 */}
          <SafeImage
            src={item.partnerImage}
            alt={`${item.benefitName} 로고`}
            fallbackLabel={item.partnerName || item.benefitName}
            className="h-[82px] w-[82px] object-contain mt-4 max-xl:h-[60px] max-xl:w-[60px] max-xlg:mt-1 max-md:h-[98px] max-md:w-[98px] max-sm:h-[60px] max-sm:w-[60px]"
          />
          <div className="flex flex-grow" />
          <p className="text-grey05 text-title-6 text-center mt-2 line-clamp-2 max-xlg:mt-3 max-xlg:line-clamp-3 min-h-[3rem] max-xl:text-title-7 max-lg:text-title-8 max-md:text-title-6 max-sm:text-title-7 break-keep leading-snug">
            {item.benefitName}
          </p>
        </div>
      ))}
    </div>
  );
}
