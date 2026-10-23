import SafeImage from '../../../../components/SafeImage';
import { TbBookmark } from 'react-icons/tb';
import { FavoriteItem } from '../../../../types/favorites';
import { getPartnerBenefitPreview } from '../../../../utils/benefitPreview';
import { getCarrierLabel, isCarrierCode } from '../../../../utils/membership';
import { useReferenceData } from '../../../../components/ReferenceDataProvider';

interface BenefitCardListProps {
  items: FavoriteItem[];
  userCarrier?: string | null;
  userGrade?: string | null;
  selectedId: number | null;
  setSelectedId: (id: number) => void;
  onOpenDetails: (id: number) => void;
  isEditing: boolean;
  selectedItems: number[];
  setSelectedItems: (ids: number[]) => void;
  onRequestDelete: (id: number) => void;
}

export default function BenefitCardList({
  items,
  userCarrier,
  userGrade,
  selectedId,
  setSelectedId,
  onOpenDetails,
  isEditing,
  selectedItems,
  setSelectedItems,
  onRequestDelete,
}: BenefitCardListProps) {
  const { data: referenceData } = useReferenceData();
  return (
    <div className="divide-y divide-warmBorder border-y border-warmBorder">
      {items.map((item) => {
        const previewSource = {
          partnerName: item.partnerName,
          previews: item.previews,
        };
        const preview =
          getPartnerBenefitPreview(
            previewSource,
            isCarrierCode(userCarrier) ? userCarrier : undefined,
            userGrade ?? undefined,
            referenceData
          ) ?? getPartnerBenefitPreview(previewSource, undefined, undefined, referenceData);
        const isSelected = selectedItems.includes(item.benefitId);
        const isActive = selectedId === item.benefitId;
        const checkboxId = `favorite-benefit-${item.benefitId}`;

        return (
          <article
            key={item.benefitId}
            className={`grid min-w-0 grid-cols-[minmax(180px,1.1fr)_minmax(0,1.5fr)_100px_auto_auto] items-center gap-5 py-5 transition-colors max-xl:grid-cols-[minmax(160px,1fr)_minmax(0,1.4fr)_80px_auto_auto] max-md:grid-cols-[minmax(0,1fr)_auto] max-md:gap-x-3 max-md:gap-y-3 ${isActive ? 'bg-[#faf9ff]' : ''}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              {isEditing ? (
                <input
                  id={checkboxId}
                  type="checkbox"
                  aria-label={`${item.benefitName} 선택`}
                  checked={isSelected}
                  onChange={(event) =>
                    setSelectedItems(
                      event.target.checked
                        ? [...selectedItems, item.benefitId]
                        : selectedItems.filter((id) => id !== item.benefitId)
                    )
                  }
                  className="h-5 w-5 shrink-0 accent-[#6154d9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154d9]"
                />
              ) : null}
              <SafeImage
                src={item.partnerImage}
                alt={`${item.partnerName || item.benefitName} 로고`}
                fallbackLabel={item.partnerName || item.benefitName}
                className="h-11 w-11 shrink-0 rounded-lg border border-warmBorder bg-white p-1 object-contain"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedId(item.benefitId);
                  onOpenDetails(item.benefitId);
                }}
                className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154d9]"
              >
                <span className="block truncate text-sm font-semibold text-ink">
                  {item.partnerName || item.benefitName}
                </span>
                {item.partnerName && item.partnerName !== item.benefitName ? (
                  <span className="mt-0.5 block truncate text-xs leading-5 text-warmMuted">
                    {item.benefitName}
                  </span>
                ) : null}
              </button>
            </div>

            <div className="min-w-0 max-md:col-span-2">
              {preview ? (
                <>
                  <p className="truncate text-sm font-semibold text-ink">{preview.title}</p>
                  <p className="mt-1 truncate text-xs text-warmMuted">
                    {getCarrierLabel(preview.carrier)} {preview.grades ? `· ${preview.grades}` : ''}
                    {preview.condition ? ` · ${preview.condition}` : ''}
                  </p>
                </>
              ) : (
                <p className="text-sm text-grey05">혜택 조건은 상세에서 확인해 주세요.</p>
              )}
            </div>

            <p className="text-xs text-warmMuted max-md:col-span-2 max-md:pl-14">
              {preview?.limit || (preview?.usage ? preview.usage : '조건 확인')}
            </p>

            {!isEditing ? (
              <button
                type="button"
                onClick={() => onRequestDelete(item.benefitId)}
                aria-label={`${item.partnerName || item.benefitName} 관심 혜택 해제`}
                title="관심 혜택 해제"
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[#6154d9] hover:bg-[#f0edfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154d9] max-md:col-start-2 max-md:row-start-1"
              >
                <TbBookmark size={19} aria-hidden="true" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setSelectedId(item.benefitId);
                onOpenDetails(item.benefitId);
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-warmBorder px-3 text-sm font-semibold text-brandStrong hover:bg-brandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand max-md:col-span-2 max-md:w-full"
            >
              자세히
            </button>
          </article>
        );
      })}
    </div>
  );
}
