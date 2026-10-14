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
      className={`group relative [content-visibility:auto] [contain-intrinsic-size:auto_112px] overflow-hidden border-b max-md:[contain-intrinsic-size:auto_120px] ${
        isSelected ? 'border-[#e8e9ee] bg-[#f7f5ff]' : 'border-[#e8e9ee] bg-white'
      }`}
    >
      <button
        type="button"
        aria-label={`${platform.name} 혜택 상세 보기`}
        aria-expanded={isSelected}
        className="absolute inset-0 z-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6154d9]"
        onClick={() => onSelect(platform)}
      />

      <div
        className={`pointer-events-none relative z-10 flex min-h-[108px] items-center gap-3 px-4 py-3 max-md:items-start max-md:px-3 ${isSelected ? 'shadow-[inset_3px_0_#6154d9]' : ''}`}
      >
        <SafeImage
          src={platform.imageUrl}
          alt={`${platform.name} 로고`}
          fallbackLabel={platform.name}
          className="h-11 w-11 shrink-0 rounded-lg object-contain max-md:mt-0.5"
          fallbackClassName="bg-[#f0edfc] text-[#686b73] text-xs font-semibold"
          loading="lazy"
        />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-2">
            <h3 className="truncate text-[14px] font-semibold leading-5 text-[#202124] max-md:line-clamp-2 max-md:whitespace-normal">
              {platform.name}
            </h3>
            {platform.category && (
              <span className="shrink-0 text-[10px] font-medium text-[#686b73] max-md:hidden">
                {platform.category}
              </span>
            )}
          </div>

          <div className="mt-1 hidden min-w-0 items-center gap-2 text-[10px] font-medium text-[#686b73] max-md:flex">
            {platform.category && <span className="min-w-0 truncate">{platform.category}</span>}
            <span className="ml-auto shrink-0 text-right text-[12px] font-medium text-[#252525]">
              {formatDistance(platform.distance)}
            </span>
          </div>

          <div className="mt-1 flex min-w-0 items-baseline gap-1.5 max-md:block">
            <span className="shrink-0 text-[10px] font-medium text-[#686b73]">주요 혜택</span>
            <p className="line-clamp-2 min-w-0 text-[13px] font-medium leading-[18px] text-[#202124]">
              {benefitText}
            </p>
          </div>

          {(platform.roadAddress || platform.address) && (
            <p className="mt-0.5 truncate text-[12px] leading-4 text-[#686b73]">
              {platform.roadAddress || platform.address}
            </p>
          )}

          <div className="pointer-events-auto mt-1.5 flex flex-wrap items-center gap-1">
            {benefitGroups.slice(0, 3).map((group) => {
              const carrierSelectable = isCarrierCode(group.key);
              const carrierClass =
                platform.carrier === group.key
                  ? 'border-[#6154d9]/30 bg-[#f0edfc] text-[#6154d9]'
                  : 'border-[#e8e9ee] bg-white text-[#686b73]';

              if (!carrierSelectable) {
                return (
                  <span
                    key={group.key}
                    className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-2 text-[11px] font-medium ${carrierClass}`}
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
                  className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-2 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154d9] ${carrierClass}`}
                  aria-label={`${group.label} 혜택으로 ${platform.name} 보기`}
                >
                  {group.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 text-right max-md:hidden">
          <div>
            <p className="text-[10px] text-[#686b73]">거리</p>
            <p className="mt-0.5 text-[12px] font-medium text-[#202124]">
              {formatDistance(platform.distance)}
            </p>
          </div>
          <TbChevronRight className="h-5 w-5 text-[#686b73]" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
};

StoreCard.displayName = 'StoreCard';

export default React.memo(StoreCard);
