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
  return (
    <div className="grid grid-cols-3 gap-3 min-h-[300px] max-xl:min-h-[260px] max-xlg:grid-cols-2 max-md:gap-3">
      {items.map((item) => {
        const isCardSelected = isEditing
          ? selectedItems.includes(item.benefitId)
          : selectedId === item.benefitId;
        const checkboxId = `favorite-benefit-${item.benefitId}`;

        return (
          <article
            key={item.benefitId}
            className={`relative flex aspect-[4/3] w-full cursor-pointer flex-col items-center rounded-[16px] border-none bg-white p-3 shadow-[0_10px_28px_rgba(16,17,20,0.10)] transition hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(16,17,20,0.14)] max-xl:aspect-[4/3] max-md:max-h-none max-md:aspect-[4/3] max-sm:aspect-[12/13] ${
              isCardSelected ? 'ring-2 ring-purple04 bg-purple01/30' : ''
            }`}
          >
            {/* 편집 모드일 때 체크박스 표시 */}
            {isEditing ? (
              <>
                <label
                  htmlFor={checkboxId}
                  className="absolute inset-0 z-0 cursor-pointer rounded-[16px]"
                >
                  <span className="sr-only">{item.benefitName} 선택 상태 변경</span>
                </label>
                <input
                  id={checkboxId}
                  type="checkbox"
                  aria-label={`${item.benefitName} 선택`}
                  checked={selectedItems.includes(item.benefitId)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedItems([...selectedItems, item.benefitId]);
                    } else {
                      setSelectedItems(selectedItems.filter((id) => id !== item.benefitId));
                    }
                  }}
                  className="pointer-events-auto absolute right-4 top-4 z-20 h-5 w-5 cursor-pointer appearance-none rounded-md border border-grey03 bg-white bg-center bg-no-repeat accent-purple04 checked:border-purple04 checked:bg-[url('/images/myPage/icon-check.png')] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 max-xl:h-4 max-xl:w-4 max-xl:rounded-[4px]"
                />
              </>
            ) : (
              <button
                type="button"
                aria-label={`${item.benefitName} 상세 보기`}
                aria-expanded={isCardSelected}
                onClick={() => setSelectedId(item.benefitId)}
                className="absolute inset-0 z-0 cursor-pointer rounded-[16px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple02"
              />
            )}

            {/* 즐겨찾기 해제 버튼 (편집 모드 아닐 때만 표시) */}
            {!isEditing && (
              <button
                type="button"
                onClick={() => onRequestDelete(item.benefitId)}
                aria-label={`${item.benefitName} 즐겨찾기 해제`}
                className="pointer-events-auto absolute right-4 top-4 z-20 rounded-full bg-orange01 p-1 text-orange04 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 max-xl:right-4 max-xl:top-4"
                title="즐겨찾기 해제"
              >
                <TbStarFilled size={20} aria-hidden="true" />
              </button>
            )}

            <div className="pointer-events-none relative z-10 flex h-full w-full flex-col items-center">
              {/* 카드 이미지 및 제목 */}
              <SafeImage
                src={item.partnerImage}
                alt={`${item.benefitName} 로고`}
                fallbackLabel={item.partnerName || item.benefitName}
                className="mt-1.5 h-[58px] w-[58px] object-contain max-xl:h-[52px] max-xl:w-[52px] max-xlg:mt-1 max-md:h-[98px] max-md:w-[98px] max-sm:h-[60px] max-sm:w-[60px]"
              />
              <div className="flex flex-grow" />
              <p className="mt-1.5 line-clamp-2 min-h-[2.4rem] break-keep text-center text-body-2-bold leading-snug text-grey05 max-xl:text-body-3-bold max-xlg:mt-3 max-xlg:line-clamp-3 max-lg:text-title-8 max-md:text-title-6 max-sm:text-title-7">
                {item.benefitName}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
