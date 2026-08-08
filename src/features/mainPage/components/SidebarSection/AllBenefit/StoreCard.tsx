import React from 'react';
import { TbChevronRight } from 'react-icons/tb';
import SafeImage from '../../../../../components/SafeImage';
import { Platform } from '../../../types';
import { isCarrierCode } from '../../../../../utils/membership';
import { groupPlatformBenefitsByCarrier } from '../../../utils/benefitGrouping';

interface StoreCardProps {
  platform: Platform;
  isSelected: boolean;
  onSelect: (platform: Platform) => void;
}

const formatDistance = (distance: number) => {
  if (!Number.isFinite(distance)) return '';
  if (distance < 1) return `${Math.round(distance * 1000)}m`;
  return `${distance.toFixed(1)}km`;
};

const StoreCard: React.FC<StoreCardProps> = ({ platform, isSelected, onSelect }) => {
  const benefitGroups = groupPlatformBenefitsByCarrier(platform);
  const featuredBenefit = benefitGroups
    .flatMap((group) => group.benefits)
    .find((benefit) => benefit.context && benefit.context !== '-');
  const benefitText = featuredBenefit?.context || platform.benefits?.[0] || '혜택 확인하기';

  return (
    <article
      className={`group relative mx-5 my-1.5 overflow-hidden rounded-xl border bg-warmSurface transition-[border-color,background-color,box-shadow,transform] hover:-translate-y-px hover:border-brand/30 hover:shadow-[0_7px_18px_rgba(36,35,33,0.07)] max-md:mx-4 max-md:my-1 ${
        isSelected
          ? 'border-brand/40 bg-brandSoft shadow-[0_5px_16px_rgba(17,92,58,0.08)]'
          : 'border-warmBorder'
      }`}
    >
      <button
        type="button"
        aria-label={`${platform.name} 혜택 상세 보기`}
        aria-expanded={isSelected}
        className="absolute inset-0 z-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
        onClick={() => onSelect(platform)}
      />

      <div className="pointer-events-none relative z-10 flex min-h-[98px] items-center gap-3 px-3 py-3 max-md:min-h-[88px] max-md:px-3 max-md:py-2.5">
        <SafeImage
          src={platform.imageUrl}
          alt={`${platform.name} 로고`}
          fallbackLabel={platform.name}
          className="h-12 w-12 shrink-0 rounded-full border border-warmBorder bg-white object-contain p-0.5 max-md:h-11 max-md:w-11"
          fallbackClassName="bg-brandSoft text-brandStrong text-xs font-bold"
          loading="lazy"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[14px] font-bold leading-5 text-ink">{platform.name}</h3>
            {platform.category && (
              <span className="shrink-0 text-[10px] font-medium text-grey04">
                {platform.category}
              </span>
            )}
          </div>

          <p className="mt-1 line-clamp-1 text-[12px] font-bold leading-5 text-brandStrong">
            {benefitText}
          </p>

          <div className="pointer-events-auto mt-1.5 flex flex-wrap items-center gap-1">
            {benefitGroups.slice(0, 3).map((group) => {
              const carrierSelectable = isCarrierCode(group.key);
              const carrierClass =
                platform.carrier === group.key
                  ? 'border-brand/30 bg-brandSoft text-brandStrong'
                  : 'border-warmBorder bg-warmCanvas text-grey05';

              if (!carrierSelectable) {
                return (
                  <span
                    key={group.key}
                    className={`inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-bold ${carrierClass}`}
                  >
                    {group.label}
                  </span>
                );
              }

              return (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => onSelect({ ...platform, carrier: group.key })}
                  className={`inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-bold transition-colors hover:border-brand/30 hover:bg-brandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${carrierClass}`}
                  aria-label={`${group.label} 혜택으로 ${platform.name} 보기`}
                >
                  {group.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 text-right">
          <div>
            <p className="text-[12px] font-bold text-grey05">{formatDistance(platform.distance)}</p>
            <p className="mt-0.5 text-[10px] text-grey04">
              도보 {Math.max(1, Math.round(platform.distance * 12))}분
            </p>
          </div>
          <TbChevronRight className="h-5 w-5 text-grey04 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </article>
  );
};

export default StoreCard;
