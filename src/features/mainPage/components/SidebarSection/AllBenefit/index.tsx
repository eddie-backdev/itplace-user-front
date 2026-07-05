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
  selectedPlatform?: Platform | null;
  onPlatformSelect: (platform: Platform) => void;
  currentLocation: string;
  isLoading: boolean;
  error?: string | null;
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
  selectedPlatform,
  onPlatformSelect,
  currentLocation,
  isLoading,
  error,
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
  }, [platforms]);

  const renderHeader = (title: string, subtitle?: string, onBack?: () => void) => (
    <div className="mb-4 max-md:mb-3 max-sm:mb-2 max-md:px-4 max-sm:px-3">
      <div className={`${onBack ? 'flex items-start justify-between gap-3' : ''}`}>
        <div>
          <h3 className="text-lg font-bold text-grey06 max-md:text-title-7 max-sm:text-title-7">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 text-body-4 text-grey04 max-md:text-body-5">{subtitle}</p>
          )}
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex shrink-0 items-center rounded-full border border-grey02 px-3 py-1.5 text-body-5 font-bold text-grey05 transition-colors hover:border-purple02 hover:text-purple04 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
          >
            돌아가기
          </button>
        )}
      </div>
    </div>
  );

  const renderDivider = () => (
    <div className="border-b border-grey03 w-[330px] mb-0 max-md:mx-4 max-sm:mx-3 max-md:w-auto" />
  );

  const renderStoreList = (
    items: Platform[],
    title = currentLocation,
    subtitle?: string,
    onBack?: () => void
  ) => (
    <div className="flex-1 min-h-0 flex flex-col">
      {renderHeader(title, subtitle, onBack)}
      {renderDivider()}
      <div className="-mx-5 flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-10 max-md:overflow-y-scroll max-md:mx-0 max-md:pb-24">
        {items.map((platform, index) => (
          <div key={platform.id}>
            <StoreCard
              platform={platform}
              isSelected={selectedPlatform?.id === platform.id}
              onSelect={onPlatformSelect}
            />

            {index < items.length - 1 && (
              <div className="border-b border-grey03 mx-5 w-[330px] max-md:mx-4 max-sm:mx-3 max-md:w-auto" />
            )}
          </div>
        ))}
        <div className="h-8 max-md:h-10 max-sm:h-8"></div>
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
          className="h-10 w-10 shrink-0 rounded-xl object-contain"
          fallbackClassName="bg-purple01 text-body-4-bold"
          loading="lazy"
        />
      );
    }

    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple01 px-1 text-center text-[11px] font-bold leading-tight text-purple04">
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
      className="flex w-full items-center gap-3 rounded-2xl border border-grey02 bg-white px-4 py-3 text-left transition-colors hover:border-purple02 hover:bg-purple01/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
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
  const shouldShowBlockingLoading = isLoading && (!hasPlatforms || displayMode !== 'summary');

  if (shouldShowBlockingLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-grey06 mb-4 max-md:text-title-7 max-md:mb-3 max-sm:text-title-7 max-sm:mb-2 max-md:px-4 max-sm:px-3">
          근처 제휴처를 찾고 있습니다...
        </h3>
        <div className="border-b border-grey03 w-[330px] max-md:w-full mb-0 max-md:mx-4 max-sm:mx-3" />

        <div className="flex-1 flex flex-col items-center justify-center">
          <LoadingSpinner />
          <div className="mt-4 text-grey04 text-sm max-md:text-xs max-md:mt-3 max-sm:text-xs max-sm:mt-2">
            제휴처 데이터를 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center max-md:mt-12">
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

  if (!hasPlatforms) {
    return (
      <div className="flex-1 flex flex-col">
        {renderHeader(currentLocation)}
        {renderDivider()}

        <div className="flex-1 flex items-center justify-center min-h-0 max-md:min-h-56 max-md:mt-4">
          <NoResult
            message1="주변 제휴처가 없어요!"
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

  if (displayMode !== 'summary') {
    return renderStoreList(platforms);
  }

  if (drilldown) {
    return renderStoreList(drilldown.platforms, drilldown.title, drilldown.subtitle, () =>
      setDrilldown(null)
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {renderHeader(
        '현재 지도 영역의 혜택',
        summary.hasBenefitDetails
          ? `${currentLocation} · ${summary.totalStores}개 매장 · ${summary.totalPartners}개 제휴처 · ${summary.totalBenefits}개 혜택 조건`
          : `${currentLocation} · ${summary.totalStores}개 매장 · ${summary.totalPartners}개 제휴처`
      )}
      {renderDivider()}

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

export default StoreCardsSection;
