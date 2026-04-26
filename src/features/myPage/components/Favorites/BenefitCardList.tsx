// src/features/myPage/components/BenefitCardList.tsx
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
    <div className="grid grid-cols-3 gap-x-10 gap-y-5 min-h-[520px] max-xl:min-h-[300px] max-xl:gap-x-5 max-xlg:gap-x-3 max-xlg:grid-cols-2">
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
          className={`relative p-4 border flex flex-col items-center rounded-[18px] aspect-[12/13] w-full max-xl:aspect-[1/1] max-xlg:max-h-[150px] max-md:max-h-none max-md:aspect-[4/3] max-sm:aspect-[12/13] cursor-pointer border-none shadow-[0px_3px_12px_rgba(0,0,0,0.15)] ${
            isEditing
              ? selectedItems.includes(item.benefitId)
                ? 'ring-2 ring-purple04'
                : ''
              : selectedId === item.benefitId
                ? 'ring-2 ring-purple04'
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
              className="absolute top-5 right-5 w-5 h-5 max-xl:w-4 max-xl:h-4 accent-purple04 appearance-none rounded-md max-xl:rounded-[4px] border border-grey03 checked:bg-[url('/images/myPage/icon-check.png')] bg-no-repeat bg-center checked:border-purple04"
            />
          )}

          {/* 즐겨찾기 해제 버튼 (편집 모드 아닐 때만 표시) */}
          {!isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete(item.benefitId); // 모달 열기
              }}
              className="absolute top-5 right-5 max-xl:top-4 max-xl:right-4 text-orange03 hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 rounded-full"
              title="즐겨찾기 해제"
            >
              <TbStarFilled size={22} />
            </button>
          )}

          {/* 카드 이미지 및 제목 */}
          <img
            src={item.partnerImage}
            alt={item.benefitName}
            className="h-[108px] w-auto object-contain mt-6 max-xl:h-[60px] max-xlg:mt-1 max-md:h-[98px] max-sm:h-[60px]"
          />
          <div className="flex flex-grow" />
          <p className="text-grey05 text-title-5 text-center mt-2 line-clamp-2 max-xlg:mt-3 max-xlg:line-clamp-3 min-h-[4rem] max-xl:text-title-7 max-lg:text-title-8 max-md:text-title-6 max-sm:text-title-7 ">
            {item.benefitName}
          </p>
        </div>
      ))}
    </div>
  );
}
