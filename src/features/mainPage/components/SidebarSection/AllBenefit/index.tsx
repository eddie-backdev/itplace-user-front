import React, { useEffect, useMemo, useState } from 'react';
import { Platform } from '../../../types';
import StoreCard from './StoreCard';
import SafeImage from '../../../../../components/SafeImage';
import LoadingSpinner from '../../../../../components/LoadingSpinner';
import NoResult from '../../../../../components/NoResult';
import {
  BENEFIT_USAGE_CHANNEL_LABELS,
  groupPlatformBenefitsByCarrier,
} from '../../../utils/benefitGrouping';

interface StoreCardsSectionProps {
  platforms: Platform[];
  isClusterView?: boolean;
  selectedPlatform?: Platform | null;
  onPlatformSelect: (platform: Platform) => void;
  currentLocation: string;
  isLoading: boolean;
  error?: string | null;
  mapUnavailable?: boolean;
  searchQuery?: string;
  displayMode?: 'summary' | 'list';
  backButton?: {
    onBack: () => void;
    label: string;
  };
}

type SummaryEntry = {
  key: string;
  title: string;
  subtitle: string;
  countLabel: string;
  platforms: Platform[];
  badge?: string;
  imageUrl?: string;
};

type SummaryDrilldown = {
  title: string;
  subtitle: string;
  platforms: Platform[];
};

interface StoreListRowsProps {
  platforms: Platform[];
  selectedPlatform?: Platform | null;
  onPlatformSelect: (platform: Platform) => void;
}

const StoreListRows = React.memo(
  ({ platforms, selectedPlatform, onPlatformSelect }: StoreListRowsProps) => (
    <>
      {platforms.map((platform) => (
        <div key={platform.id}>
          <StoreCard
            platform={platform}
            isSelected={selectedPlatform?.id === platform.id}
            onSelect={onPlatformSelect}
          />
        </div>
      ))}
      <div className="h-8 max-md:h-10 max-sm:h-8" />
    </>
  )
);
StoreListRows.displayName = 'StoreListRows';

const uniquePlatforms = (platforms: Platform[]) => {
  const byId = new Map<string, Platform>();
  platforms.forEach((platform) => {
    byId.set(platform.id, platform);
  });
  return [...byId.values()].sort((first, second) => first.distance - second.distance);
};

const formatDistance = (distance: number) => `${distance.toFixed(1)}km`;

const formatCarrierBadge = (carrierKey: string, carrierLabel: string) => {
  if (carrierKey === 'SKT' || carrierKey === 'KT') return carrierKey;
  if (carrierKey === 'LGU') return 'LGU';
  if (carrierLabel && carrierLabel !== '통신사 정보 없음') return carrierLabel;
  return '혜택';
};

const StoreCardsSection: React.FC<StoreCardsSectionProps> = ({
  platforms,
  isClusterView = false,
  selectedPlatform,
  onPlatformSelect,
  currentLocation,
  isLoading,
  error,
  mapUnavailable = false,
  searchQuery = '',
  displayMode = 'list',
  backButton,
}) => {
  const [drilldown, setDrilldown] = useState<SummaryDrilldown | null>(null);

  useEffect(() => {
    if (displayMode !== 'summary') {
      setDrilldown(null);
    }
  }, [displayMode]);

  const summary = useMemo(() => {
    if (displayMode !== 'summary') return null;

    const categoryMap = new Map<string, Platform[]>();
    const partnerMap = new Map<string, Platform[]>();
    const carrierMap = new Map<
      string,
      { label: string; platforms: Platform[]; benefitCount: number }
    >();
    const benefitMap = new Map<
      string,
      {
        title: string;
        subtitle: string;
        platforms: Platform[];
        benefitCount: number;
        badge: string;
      }
    >();

    platforms.forEach((platform) => {
      const category = platform.category || '기타';
      categoryMap.set(category, [...(categoryMap.get(category) ?? []), platform]);

      const partnerKey = String(platform.partnerId);
      partnerMap.set(partnerKey, [...(partnerMap.get(partnerKey) ?? []), platform]);

      groupPlatformBenefitsByCarrier(platform).forEach((carrierGroup) => {
        const carrier = carrierMap.get(carrierGroup.key) ?? {
          label: carrierGroup.label,
          platforms: [],
          benefitCount: 0,
        };
        carrier.platforms.push(platform);
        carrier.benefitCount += carrierGroup.benefits.length;
        carrierMap.set(carrierGroup.key, carrier);

        carrierGroup.benefits.forEach((benefit) => {
          const benefitKey = [carrierGroup.key, benefit.channel, benefit.context].join('|');
          const benefitEntry = benefitMap.get(benefitKey) ?? {
            title: benefit.context,
            subtitle: `${carrierGroup.label} · ${BENEFIT_USAGE_CHANNEL_LABELS[benefit.channel]}`,
            platforms: [],
            benefitCount: 0,
            badge: formatCarrierBadge(carrierGroup.key, carrierGroup.label),
          };
          benefitEntry.platforms.push(platform);
          benefitEntry.benefitCount += 1;
          benefitMap.set(benefitKey, benefitEntry);
        });
      });
    });

    const categories: SummaryEntry[] = [...categoryMap.entries()]
      .map(([category, categoryPlatforms]) => ({
        key: category,
        title: category,
        subtitle: `${new Set(categoryPlatforms.map((platform) => platform.partnerId)).size}개 제휴처`,
        countLabel: `${categoryPlatforms.length}개 매장`,
        platforms: uniquePlatforms(categoryPlatforms),
      }))
      .sort((first, second) => second.platforms.length - first.platforms.length)
      .slice(0, 8);

    const partners: SummaryEntry[] = [...partnerMap.entries()]
      .map(([partnerId, partnerPlatforms]) => {
        const orderedPlatforms = uniquePlatforms(partnerPlatforms);
        const representative = orderedPlatforms[0];
        return {
          key: partnerId,
          title: representative?.partnerName || representative?.name || '제휴처',
          subtitle: representative?.category || '카테고리 없음',
          countLabel: `${orderedPlatforms.length}개 매장 · 가장 가까운 곳 ${formatDistance(representative?.distance ?? 0)}`,
          platforms: orderedPlatforms,
          imageUrl: representative?.imageUrl,
        };
      })
      .sort((first, second) => {
        if (second.platforms.length !== first.platforms.length) {
          return second.platforms.length - first.platforms.length;
        }
        return first.platforms[0].distance - second.platforms[0].distance;
      })
      .slice(0, 10);

    const carriers: SummaryEntry[] = [...carrierMap.entries()]
      .map(([carrier, carrierInfo]) => {
        const carrierPlatforms = uniquePlatforms(carrierInfo.platforms);
        return {
          key: carrier,
          title: carrierInfo.label,
          subtitle: `${carrierInfo.benefitCount}개 혜택 조건`,
          countLabel: `${carrierPlatforms.length}개 매장`,
          platforms: carrierPlatforms,
          badge: carrier,
        };
      })
      .sort((first, second) => second.platforms.length - first.platforms.length);

    const benefits: SummaryEntry[] = [...benefitMap.entries()]
      .map(([benefitKey, benefitInfo]) => {
        const benefitPlatforms = uniquePlatforms(benefitInfo.platforms);
        return {
          key: benefitKey,
          title: benefitInfo.title,
          subtitle: benefitInfo.subtitle,
          countLabel: `${benefitPlatforms.length}개 매장`,
          platforms: benefitPlatforms,
          badge: benefitInfo.badge,
        };
      })
      .sort((first, second) => second.platforms.length - first.platforms.length)
      .slice(0, 6);

    return {
      categories,
      partners,
      carriers,
      benefits,
      totalStores: platforms.length,
      totalPartners: partnerMap.size,
      totalBenefits: benefitMap.size,
      hasBenefitDetails: platforms.some((platform) => (platform.benefitDetails?.length ?? 0) > 0),
    };
  }, [displayMode, platforms]);

  const renderHeader = (title: string, subtitle?: string, onBack?: () => void) => (
    <div className="mb-2 px-4 max-sm:px-3">
      <div className={`${onBack ? 'flex items-start justify-between gap-3' : ''}`}>
        <div>
          <h3 className="text-[15px] font-semibold leading-5 text-[#202120]">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 truncate text-[12px] leading-4 text-[#69717e]">{subtitle}</p>
          )}
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex min-h-11 shrink-0 items-center rounded-lg border border-[#e6e6e3] px-3 text-[12px] font-medium text-[#252525] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
          >
            돌아가기
          </button>
        )}
      </div>
    </div>
  );

  const renderDivider = () => <div className="mb-0 w-full border-b border-[#e6e6e3]" />;

  const renderCompactHeader = (title: string, location: string) => (
    <div className="mb-2 flex min-w-0 items-baseline gap-1 px-4 max-sm:px-3">
      <h3 className="shrink-0 whitespace-nowrap text-[15px] font-semibold leading-5 text-[#202120]">
        {title}
      </h3>
      <span aria-hidden="true" className="shrink-0 text-[12px] leading-4 text-[#9aa0a8]">
        ·
      </span>
      <p className="min-w-0 truncate text-[12px] leading-4 text-[#69717e]">{location}</p>
    </div>
  );

  const renderStoreList = (
    items: Platform[],
    title = currentLocation,
    subtitle?: string,
    onBack?: () => void,
    compactHeader = false
  ) => (
    <div className="flex-1 min-h-0 flex flex-col" aria-busy={isLoading}>
      {compactHeader
        ? renderCompactHeader(title, subtitle ?? '')
        : renderHeader(title, subtitle, onBack)}
      {renderDivider()}
      {isLoading && (
        <div
          role="status"
          className="flex shrink-0 items-center gap-2 px-5 py-2 text-[12px] text-grey04 max-md:px-4"
        >
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0066cc] border-t-transparent"
          />
          검색 결과를 업데이트하고 있어요
        </div>
      )}
      <div className="-mx-4 min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-10 pt-1.5 max-md:mx-0 max-md:overflow-y-scroll max-md:pb-24 max-md:pt-1">
        <StoreListRows
          platforms={items}
          selectedPlatform={selectedPlatform}
          onPlatformSelect={onPlatformSelect}
        />
      </div>
    </div>
  );

  const renderSummaryVisual = (entry: SummaryEntry) => {
    if (entry.imageUrl) {
      return (
        <SafeImage
          src={entry.imageUrl}
          alt={`${entry.title} 로고`}
          fallbackLabel={entry.badge || entry.title}
          className="h-10 w-10 shrink-0 rounded-lg object-contain"
          fallbackClassName="bg-[#f1f1ee] text-body-4-bold text-grey05"
          loading="lazy"
        />
      );
    }

    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f1f1ee] px-1 text-center text-[11px] font-semibold leading-tight text-grey05">
        {entry.badge || entry.title}
      </span>
    );
  };

  const renderSummaryCard = (entry: SummaryEntry) => (
    <button
      key={entry.key}
      type="button"
      onClick={() =>
        setDrilldown({
          title: entry.title,
          subtitle: `${entry.countLabel} · ${entry.subtitle}`,
          platforms: entry.platforms,
        })
      }
      className="flex w-full items-center gap-3 rounded-xl border border-[#e6e6e3] bg-white px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
    >
      {renderSummaryVisual(entry)}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-2-bold text-grey06">{entry.title}</span>
        <span className="mt-1 block truncate text-body-5 text-grey04">{entry.subtitle}</span>
      </span>
      <span className="shrink-0 rounded-full bg-grey01 px-2.5 py-1 text-body-5-bold text-grey05">
        {entry.countLabel}
      </span>
    </button>
  );

  const renderSummarySection = (title: string, entries: SummaryEntry[]) => {
    if (entries.length === 0) return null;

    return (
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-body-2-bold text-grey06">{title}</h4>
          <span className="text-body-5 text-grey04">클릭해서 자세히 보기</span>
        </div>
        <div className="space-y-2">{entries.map(renderSummaryCard)}</div>
      </section>
    );
  };

  const hasPlatforms = platforms.length > 0;
  const shouldShowBlockingLoading = isLoading && !hasPlatforms;

  if (mapUnavailable && !hasPlatforms && displayMode === 'list') {
    const query = searchQuery.trim();
    const benefitsHref = query ? `/benefits?q=${encodeURIComponent(query)}` : '/benefits';

    return (
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center max-md:min-h-56">
        <div
          role="alert"
          className="w-full max-w-[360px] rounded-2xl border border-warmBorder bg-warmSurface p-6 shadow-soft max-md:p-5"
        >
          <h3 className="text-title-6 font-semibold text-ink">지도를 열지 못했어요</h3>
          <p className="mt-2 text-body-4 leading-6 text-inkMuted">
            {query
              ? `“${query}” 검색은 전체 혜택에서 계속할 수 있어요.`
              : '전체 혜택 목록에서 제휴처를 계속 둘러볼 수 있어요.'}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <a
              href={benefitsHref}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0066cc] px-4 text-body-3-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
            >
              전체 혜택에서 찾기
            </a>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-warmBorder bg-white px-4 text-body-3-bold text-grey05 transition-colors hover:bg-warmCanvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (shouldShowBlockingLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center">
          <LoadingSpinner />
          <div className="mt-4 text-[13px] text-grey04">매장 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <NoResult
          variant="error"
          message1="오류가 발생했어요!"
          message2="잠시 후 다시 시도해 주세요"
          message1FontSize="text-title-6"
          message2FontSize="text-body-3"
          isLoginRequired={false}
        />
      </div>
    );
  }

  if (isClusterView) {
    return (
      <div className="flex-1 flex flex-col" aria-busy={isLoading}>
        {renderHeader('지역별 혜택 둘러보기')}
        {renderDivider()}
        <div className="flex-1 flex items-center justify-center px-6 text-center text-body-3 leading-6 text-grey04">
          지도에서 지역을 선택하거나 확대하면 매장별 혜택을 볼 수 있어요.
        </div>
      </div>
    );
  }

  if (!hasPlatforms) {
    return (
      <div className="flex-1 flex flex-col">
        {displayMode === 'list' && !backButton
          ? renderCompactHeader('0개 매장', currentLocation)
          : renderHeader(currentLocation)}
        {renderDivider()}

        <div className="flex-1 flex items-center justify-center min-h-0 max-md:min-h-56 max-md:mt-4">
          <NoResult
            message1="주변 매장이 없어요!"
            message2="다른 키워드나 지역에서 검색해보세요."
            message1FontSize="text-title-6 "
            message2FontSize="text-body-3"
            isLoginRequired={false}
          />
        </div>
      </div>
    );
  }

  if (backButton) {
    return renderStoreList(platforms, currentLocation, undefined, backButton.onBack);
  }

  if (!summary) {
    return renderStoreList(
      platforms,
      `${platforms.length}개 매장`,
      currentLocation,
      undefined,
      true
    );
  }

  if (drilldown) {
    return renderStoreList(drilldown.platforms, drilldown.title, drilldown.subtitle, () =>
      setDrilldown(null)
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col" aria-busy={isLoading}>
      {renderHeader(
        '현재 지도 영역의 혜택',
        summary.hasBenefitDetails
          ? `${currentLocation} · ${summary.totalStores}개 매장 · ${summary.totalPartners}개 제휴처 · ${summary.totalBenefits}개 혜택 조건`
          : `${currentLocation} · ${summary.totalStores}개 매장 · ${summary.totalPartners}개 제휴처`
      )}
      {renderDivider()}
      {isLoading && (
        <div
          role="status"
          className="flex shrink-0 items-center gap-2 px-5 py-2 text-[12px] text-grey04 max-md:px-4"
        >
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0066cc] border-t-transparent"
          />
          검색 결과를 업데이트하고 있어요
        </div>
      )}

      <div className="-mx-5 flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-5 pb-10 pt-4 max-md:mx-0 max-md:px-4 max-md:pb-24">
        <div className="space-y-6">
          {renderSummarySection('많이 보이는 혜택', summary.benefits)}
          {renderSummarySection('추천 제휴처', summary.partners)}
          {renderSummarySection('카테고리별 보기', summary.categories)}
          {renderSummarySection('통신사별 보기', summary.carriers)}
        </div>
      </div>
    </div>
  );
};

StoreCardsSection.displayName = 'StoreCardsSection';

export default React.memo(StoreCardsSection);
