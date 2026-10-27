import React from 'react';
import SafeImage from '../../../../../components/SafeImage';
import { Platform } from '../../../types';
import { isCarrierCode } from '../../../../../utils/membership';
import { groupPlatformBenefitsByCarrier } from '../../../utils/benefitGrouping';
import { useReferenceData } from '../../../../../components/ReferenceDataProvider';

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
  const { data } = useReferenceData();
  const benefitGroups = groupPlatformBenefitsByCarrier(platform, data);
  const featuredBenefit = benefitGroups
    .flatMap((group) => group.benefits)
    .find((benefit) => benefit.context && benefit.context !== '-');
  const benefitText = featuredBenefit?.context || platform.benefits?.[0] || '혜택 확인하기';

  return (
    <article
      className={`group relative h-[156px] [content-visibility:auto] [contain-intrinsic-size:156px] overflow-hidden border-b ${
        isSelected
          ? 'border-[var(--itplace-color-border)] bg-[var(--itplace-color-brand-subtle)]'
          : 'border-[var(--itplace-color-border)] bg-warmSurface'
      }`}
    >
      <button
        type="button"
        aria-label={`${platform.name} 혜택 상세 보기`}
        aria-expanded={isSelected}
        className="absolute inset-0 z-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--itplace-color-accent)]"
        onClick={() => onSelect(platform)}
      />

      <div
        className={`pointer-events-none relative z-10 flex h-full min-h-0 items-start gap-3 px-3 py-3 ${isSelected ? 'shadow-[inset_3px_0_var(--itplace-color-accent)]' : ''}`}
      >
        <SafeImage
          src={platform.imageUrl}
          alt={`${platform.name} 로고`}
          fallbackLabel={platform.name}
          className="mt-0.5 h-9 w-9 shrink-0 rounded-lg object-contain"
          fallbackClassName="bg-[var(--itplace-color-brand-subtle)] text-[var(--itplace-color-text-secondary)] text-xs font-semibold"
          loading="lazy"
        />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline gap-2">
            <h3 className="min-w-0 flex-1 truncate text-[14px] font-semibold leading-5 text-[var(--itplace-color-text)]">
              {platform.name}
            </h3>
            <span className="shrink-0 text-[12px] font-medium text-[var(--itplace-color-text)]">
              {formatDistance(platform.distance)}
            </span>
          </div>

          <div className="mt-1 min-w-0">
            <p className="line-clamp-2 text-[13px] font-medium leading-[18px] text-[var(--itplace-color-text)]">
              {benefitText}
            </p>
          </div>

          {(platform.roadAddress || platform.address) && (
            <p className="mt-0.5 truncate text-[12px] leading-4 text-[var(--itplace-color-text-secondary)]">
              {platform.roadAddress || platform.address}
            </p>
          )}

          <div className="pointer-events-none mt-1 flex flex-wrap items-center gap-1">
            {benefitGroups.slice(0, 3).map((group) => {
              const carrierSelectable = isCarrierCode(group.key);
              const carrierClass =
                platform.carrier === group.key
                  ? 'border-[var(--itplace-color-accent)]/30 bg-[var(--itplace-color-brand-subtle)] text-[var(--itplace-color-accent)]'
                  : 'border-[var(--itplace-color-border)] bg-warmSurface text-[var(--itplace-color-text-secondary)]';

              if (!carrierSelectable) {
                return (
                  <span
                    key={group.key}
                    className={`inline-flex min-h-7 items-center justify-center rounded-full border px-2 py-1 text-[11px] font-medium ${carrierClass}`}
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
                  className="pointer-events-auto inline-flex h-11 min-h-11 min-w-11 items-center justify-center rounded-full border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--itplace-color-accent)]"
                  aria-label={`${group.label} 혜택으로 ${platform.name} 보기`}
                >
                  <span
                    className={`inline-flex items-center justify-center rounded-full border px-2 py-1 text-[11px] font-medium ${carrierClass}`}
                  >
                    {group.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
};

StoreCard.displayName = 'StoreCard';

export default React.memo(StoreCard);
