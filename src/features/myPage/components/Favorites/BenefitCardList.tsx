// src/features/myPage/components/BenefitCardList.tsx
import SafeImage from '../../../../components/SafeImage';
import { TbStarFilled } from 'react-icons/tb';
import { FavoriteItem } from '../../../../types/favorites';
import { getPartnerBenefitPreview } from '../../../../utils/benefitPreview';
import { getCarrierLabel, isCarrierCode } from '../../../../utils/membership';

interface BenefitCardListProps {
  items: FavoriteItem[]; // 현재 페이지에 보여줄 아이템들
  userCarrier?: string | null;
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
  userCarrier,
  selectedId,
  setSelectedId,
  isEditing,
  selectedItems,
  setSelectedItems,
  onRequestDelete,
}: BenefitCardListProps) {
  return (
    <div className="grid min-h-[220px] grid-cols-3 items-stretch gap-3 max-xlg:grid-cols-2 wide:grid-cols-4 ultrawide:grid-cols-5 max-md:min-h-0 max-md:grid-cols-1 max-md:gap-3">
      {items.map((item) => {
        const previewSource = { partnerName: item.partnerName, previews: item.previews };
        const preview =
          getPartnerBenefitPreview(
            previewSource,
            isCarrierCode(userCarrier) ? userCarrier : undefined
          ) ?? getPartnerBenefitPreview(previewSource);
        const isCardSelected = isEditing
          ? selectedItems.includes(item.benefitId)
          : selectedId === item.benefitId;
        const checkboxId = `favorite-benefit-${item.benefitId}`;

        return (
          <article
            key={item.benefitId}
            className={`relative flex min-h-[184px] w-full min-w-0 cursor-pointer flex-col items-center rounded-xl border border-warmBorder bg-white p-4 pt-12 text-left transition-colors hover:border-brand/40 hover:bg-warmCanvas max-md:min-h-0 ${
              isCardSelected ? 'border-brand ring-2 ring-brand/30 bg-brandSoft/40' : ''
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
                className="absolute inset-0 z-0 cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
              />
            )}

            {/* 즐겨찾기 해제 버튼 (편집 모드 아닐 때만 표시) */}
            {!isEditing && (
              <button
                type="button"
                onClick={() => onRequestDelete(item.benefitId)}
                aria-label={`${item.partnerName || item.benefitName} 즐겨찾기 해제`}
                className="pointer-events-auto absolute right-2 top-2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-brandSoft text-brandStrong transition-colors hover:bg-brand/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                title="즐겨찾기 해제"
              >
                <TbStarFilled size={20} aria-hidden="true" />
              </button>
            )}

            <div className="pointer-events-none relative z-10 flex min-h-[128px] w-full flex-col gap-3 max-md:min-h-0">
              <div className="flex min-w-0 items-center gap-3">
                <SafeImage
                  src={item.partnerImage}
                  alt={`${item.partnerName || item.benefitName} 로고`}
                  fallbackLabel={item.partnerName || item.benefitName}
                  className="h-11 w-11 shrink-0 rounded-lg border border-warmBorder bg-white p-1 object-contain"
                />
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold leading-5 text-ink">
                    {item.partnerName || item.benefitName}
                  </p>
                  {item.partnerName && item.partnerName !== item.benefitName ? (
                    <p className="mt-0.5 break-words text-xs leading-5 text-warmMuted">
                      {item.benefitName}
                    </p>
                  ) : null}
                </div>
              </div>
              {preview ? (
                <div className="border-t border-warmBorder pt-2.5">
                  <p className="text-xs leading-5 text-warmMuted">
                    {getCarrierLabel(preview.carrier)} · {preview.grades}
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold leading-5 text-ink">
                    {preview.title}
                  </p>
                  {preview.condition ? (
                    <p className="mt-1 whitespace-pre-line break-words text-xs leading-5 text-grey05">
                      {preview.condition}
                    </p>
                  ) : null}
                  {preview.limit ? (
                    <p className="mt-2 break-words text-xs leading-5 text-warmMuted">
                      한도 · {preview.limit}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="border-t border-warmBorder pt-2.5 text-xs leading-5 text-warmMuted">
                  통신사별 적용 조건은 상세에서 확인해 주세요.
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
