import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { Platform } from '../../types';
import { FavoriteBenefit, PersonalizedRecommendationItem } from '../../types/api';
import { toCategoryOptions } from '@/utils/referenceData';
import { useReferenceData } from '@/components/ReferenceDataProvider';
import SearchSection from './SearchSection';
import InfoBannerSection from './InfoBannerSection';
import NavigationTabsSection from './NavigationTabsSection';
import StoreCardsSection from './AllBenefit';
import FavoriteStoreList from './FavoriteStoreList';
import PersonalizedRecommendationList from './PersonalizedRecommendationList';
import StoreDetailCard from './StoreDetail';
import BenefitDetailCard from './PersonalizedRecommendationList/BenefitDetailCard';
import CategoryTabsSection from './CategoryTabsSection';
import { useFavoritesList } from '../../hooks/useFavoritesList';
import { getPersonalizedRecommendations } from '../../api/personalizedRecommendationApi';
import { getFavoritesList } from '../../api/favoritesListApi';
import { getRecommendationStoresByPartner } from '../../api/recommendationStoreApi';
import { StoreData } from '../../types/api';
import { RootState } from '../../../../store';
import { useResponsive } from '../../../../hooks/useResponsive';
import { addFavoritesChangedListener } from '../../utils/favoriteEvents';
import { AI_RECOMMENDATION_ENABLED } from '../../../../config/features';

interface Tab {
  id: string;
  label: string;
}

interface SidebarSectionProps {
  platforms: Platform[];
  isClusterView?: boolean;
  selectedPlatform?: Platform | null;
  onPlatformSelect: (platform: Platform | null) => void;
  currentLocation: string;
  mapSelectedCategory: string;
  onMapCategorySelect: (categoryId: string) => void;
  isLoading: boolean;
  error?: string | null;
  onSearchChange?: (query: string) => void;
  activeTab: string;
  mapUnavailable?: boolean;
  recoverySearchQuery?: string;
  onActiveTabChange: (tab: string) => void;
  onKeywordSearch?: (keyword: string) => void;
  searchQuery?: string;
  onBenefitDetailRequest?: (benefitIds: number[]) => void;
  benefitDetailIds?: number[] | null;
  onBenefitDetailClose?: () => void;
  onShowSpeechBubble?: (message: string, partnerName: string) => void;
  userCoords?: { lat: number; lng: number } | null;
  onRecommendationStoreResults?: (results: Platform[], isShowing: boolean) => void;
  onSearchPartner?: (partnerName: string) => void;
  onBottomSheetReset?: () => void;
  // 모바일 드래그 이벤트 핸들러들 추가
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: () => void;
  detailContainer?: HTMLElement | null;
  externalDetail?: boolean;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({
  platforms,
  isClusterView = false,
  selectedPlatform,
  onPlatformSelect,
  currentLocation,
  mapSelectedCategory,
  onMapCategorySelect,
  isLoading,
  error,
  onSearchChange,
  activeTab: requestedTab,
  mapUnavailable = false,
  recoverySearchQuery = '',
  onActiveTabChange,
  onKeywordSearch,
  searchQuery,
  onBenefitDetailRequest,
  benefitDetailIds,
  onBenefitDetailClose,
  onShowSpeechBubble,
  userCoords,
  onRecommendationStoreResults,
  onBottomSheetReset,
  // 모바일 드래그 이벤트 핸들러들
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  detailContainer,
  externalDetail = false,
}) => {
  const { data: referenceData } = useReferenceData();
  const categories = toCategoryOptions(referenceData);
  const activeTab = !AI_RECOMMENDATION_ENABLED && requestedTab === 'ai' ? 'nearby' : requestedTab;
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector(
    (state: RootState) => state._persist.rehydrated && state.auth.isLoggedIn
  );
  const { isMobile, isTablet } = useResponsive();
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const detailRegionRef = useRef<HTMLDivElement>(null);
  const resultsRegionRef = useRef<HTMLDivElement>(null);
  const detailTriggerRef = useRef<HTMLElement | null>(null);
  const shouldRestoreDetailFocusRef = useRef(false);
  const wasExternalDetailOpenRef = useRef(false);
  const hasInlineBenefitDetail = Boolean(benefitDetailIds && benefitDetailIds.length > 0);
  const hasDetail = Boolean(selectedPlatform || hasInlineBenefitDetail);
  const isInlineDetail = !externalDetail && viewMode === 'detail';
  const [selectedCategory, setSelectedCategory] = useState('전체');

  // 맞춤 AI 추천 상태
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<
    PersonalizedRecommendationItem[]
  >([]);
  const [isPersonalizedRecommendationsLoading, setIsPersonalizedRecommendationsLoading] =
    useState(false);
  const [personalizedRecommendationsError, setPersonalizedRecommendationsError] = useState<
    string | null
  >(null);

  // 추천 매장 조회 결과 상태
  const [isRecommendationStoreLoading, setIsRecommendationStoreLoading] = useState(false);
  const [recommendationStoreError, setRecommendationStoreError] = useState<string | null>(null);
  const [recommendationStoreResults, setRecommendationStoreResults] = useState<Platform[]>([]);
  const [selectedPersonalizedRecommendation, setSelectedPersonalizedRecommendation] =
    useState<PersonalizedRecommendationItem | null>(null);
  const [showRecommendationStoreList, setShowRecommendationStoreList] = useState(false);

  // 채팅방 열림 상태 추가
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 즐겨찾기 데이터 관리 (관심 혜택 탭일 때만 로드)
  const {
    favorites,
    isLoading: isFavoritesLoading,
    error: favoritesError,
    refreshFavorites,
  } = useFavoritesList(activeTab === 'favorites' ? selectedCategory : undefined);
  const [allFavorites, setAllFavorites] = useState<FavoriteBenefit[]>([]);
  const [favoritesRevision, setFavoritesRevision] = useState(0);

  // 즐겨찾기 매장 목록 표시 상태
  const [showFavoriteStoreList, setShowFavoriteStoreList] = useState(false);
  const [favoriteStoreResults, setFavoriteStoreResults] = useState<Platform[]>([]);
  const [selectedFavorite, setSelectedFavorite] = useState<FavoriteBenefit | null>(null);
  const [isFavoriteStoreLoading, setIsFavoriteStoreLoading] = useState(false);
  const [favoriteStoreError, setFavoriteStoreError] = useState<string | null>(null);

  useEffect(() => {
    return addFavoritesChangedListener(() => {
      setFavoritesRevision((current) => current + 1);
    });
  }, []);

  useEffect(() => {
    if (activeTab !== 'favorites') return;
    if (!isAuthenticated) {
      setAllFavorites([]);
      return;
    }

    let isActive = true;
    const fetchAllFavorites = async () => {
      try {
        const data = await getFavoritesList({}); // 전체 카테고리
        if (isActive) setAllFavorites(data);
      } catch (error) {
        console.error('전체 즐겨찾기 조회 실패:', error);
        if (isActive) setAllFavorites([]);
      }
    };

    fetchAllFavorites();
    return () => {
      isActive = false;
    };
  }, [activeTab, favoritesRevision, isAuthenticated]);

  // 맞춤 AI 추천 초기 로드 상태 관리 (nearby 방식과 완전히 동일)
  const [isInitialRecommendationsLoad, setIsInitialRecommendationsLoad] = useState(true);
  const isInitialRecommendationsLoadRef = useRef(isInitialRecommendationsLoad);
  isInitialRecommendationsLoadRef.current = isInitialRecommendationsLoad;

  const fetchPersonalizedRecommendations = useCallback(async () => {
    if (!AI_RECOMMENDATION_ENABLED) return;
    setIsPersonalizedRecommendationsLoading(true);
    setPersonalizedRecommendationsError(null);
    try {
      const response = await getPersonalizedRecommendations();
      setPersonalizedRecommendations(response.data);
    } catch (error) {
      console.error('맞춤 AI 추천 데이터 로드 실패:', error);
      // API 에러 메시지를 그대로 전달
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (error as { message?: string })?.message ||
        '맞춤 AI 추천을 불러오는데 실패했습니다.';
      setPersonalizedRecommendationsError(errorMessage);
    } finally {
      setIsPersonalizedRecommendationsLoading(false);
    }
  }, []);

  // fetchPersonalizedRecommendations 참조를 ref로 저장 (의존성 배열 최적화)
  const fetchPersonalizedRecommendationsRef = useRef(fetchPersonalizedRecommendations);
  fetchPersonalizedRecommendationsRef.current = fetchPersonalizedRecommendations;

  // activeTab 참조를 ref로 저장 (의존성 배열 최적화)
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  // 맞춤 AI 추천 초기 로드만 (nearby 패턴과 동일)
  useEffect(() => {
    const initializeRecommendations = () => {
      if (activeTabRef.current === 'ai') {
        fetchPersonalizedRecommendationsRef.current();
      }
    };

    initializeRecommendations();
  }, []); // 빈 의존성 배열로 초기 로드만

  // 초기 로드 완료 감지 (nearby 패턴과 동일 - 맞춤 추천 데이터가 로드된 후에 완료 처리)
  useEffect(() => {
    if (
      personalizedRecommendations &&
      personalizedRecommendations.length >= 0 &&
      isInitialRecommendationsLoad
    ) {
      setIsInitialRecommendationsLoad(false);
    }
  }, [personalizedRecommendations, isInitialRecommendationsLoad]);

  // activeTab 변경 시에만 실행 (초기 로드 제외)
  useEffect(() => {
    if (isInitialRecommendationsLoadRef.current || activeTabRef.current !== 'ai') {
      return;
    }
    fetchPersonalizedRecommendationsRef.current();
  }, [activeTab]);

  // 탭 변경 시 AI 상태 초기화
  useEffect(() => {
    if (activeTab !== 'ai') {
      setShowRecommendationStoreList(false);
      setSelectedPersonalizedRecommendation(null);
      setRecommendationStoreResults([]);
      setRecommendationStoreError(null);
      setIsChatOpen(false); // 채팅방 상태도 초기화
      onRecommendationStoreResults?.([], false);
    }
  }, [activeTab, onRecommendationStoreResults]);

  // 탭 변경 시 즐겨찾기 상태 초기화
  useEffect(() => {
    if (activeTab !== 'favorites') {
      setShowFavoriteStoreList(false);
      setSelectedFavorite(null);
      setFavoriteStoreResults([]);
      setFavoriteStoreError(null);
    }
  }, [activeTab]);

  // 선택한 혜택 상세를 현재 사이드바 안에서 연다.
  const handleCardClick = useCallback(
    (platform: Platform) => {
      if (
        document.activeElement instanceof HTMLElement &&
        document.activeElement !== document.body
      ) {
        detailTriggerRef.current = document.activeElement;
      }
      onPlatformSelect(platform);
    },
    [onPlatformSelect]
  );

  // 상세보기에서 닫기
  const handleDetailClose = () => {
    onPlatformSelect(null); // selectedPlatform 초기화
  };

  // 매장 또는 추천 혜택 상세는 같은 결과 패널 안에서 연다.
  useEffect(() => {
    const hasDetail = Boolean(selectedPlatform || hasInlineBenefitDetail);
    if (externalDetail && hasDetail) {
      if (!wasExternalDetailOpenRef.current) {
        if (
          !detailTriggerRef.current &&
          document.activeElement instanceof HTMLElement &&
          document.activeElement !== document.body
        ) {
          detailTriggerRef.current = document.activeElement;
        }
        wasExternalDetailOpenRef.current = true;
      }
      return;
    }
    if (wasExternalDetailOpenRef.current && !hasDetail) {
      wasExternalDetailOpenRef.current = false;
      shouldRestoreDetailFocusRef.current = true;
    }
    if (!externalDetail && hasDetail && viewMode === 'list') {
      if (
        !detailTriggerRef.current &&
        document.activeElement instanceof HTMLElement &&
        document.activeElement !== document.body
      ) {
        detailTriggerRef.current = document.activeElement;
      }
      setViewMode('detail');
    } else if ((!hasDetail || externalDetail) && viewMode === 'detail') {
      shouldRestoreDetailFocusRef.current = true;
      setViewMode('list');
    }
  }, [externalDetail, hasInlineBenefitDetail, selectedPlatform, viewMode]);

  // 상세를 열면 제목 영역에 초점을 주고, 닫으면 열었던 목록 항목으로 복귀한다.
  useEffect(() => {
    if (viewMode === 'detail' || (externalDetail && (selectedPlatform || hasInlineBenefitDetail))) {
      detailRegionRef.current?.focus({ preventScroll: true });
    } else if (shouldRestoreDetailFocusRef.current) {
      shouldRestoreDetailFocusRef.current = false;
      const trigger = detailTriggerRef.current;
      detailTriggerRef.current = null;
      requestAnimationFrame(() => {
        const focusTarget = trigger?.isConnected ? trigger : resultsRegionRef.current;
        focusTarget?.focus({ preventScroll: true });
      });
    }
  }, [detailContainer, externalDetail, hasInlineBenefitDetail, selectedPlatform, viewMode]);

  useEffect(() => {
    if (!externalDetail || !hasDetail) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (hasInlineBenefitDetail) onBenefitDetailClose?.();
      else onPlatformSelect(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [externalDetail, hasDetail, hasInlineBenefitDetail, onBenefitDetailClose, onPlatformSelect]);

  const mainTabs: Tab[] = [
    { id: 'nearby', label: '주변 혜택' },
    { id: 'favorites', label: '관심 혜택' },
    ...(AI_RECOMMENDATION_ENABLED ? [{ id: 'ai', label: '맞춤 AI 추천' }] : []),
  ];

  const handleSearchChange = (query: string) => {
    onSearchChange?.(query);
  };

  const handleFavoriteClick = async (favorite: FavoriteBenefit) => {
    try {
      setIsFavoriteStoreLoading(true);
      setFavoriteStoreError(null);

      // 사용자 위치 정보 확인
      if (!userCoords) {
        setFavoriteStoreError('위치 정보를 가져올 수 없습니다.');
        return;
      }

      const response = await getRecommendationStoresByPartner(
        favorite.partnerName,
        userCoords.lat,
        userCoords.lng,
        userCoords.lat,
        userCoords.lng
      );

      // API 응답이 있으면 매장 목록 표시
      if (response.data && response.data.length > 0) {
        // API 응답을 Platform 형식으로 변환 (추천 매장 조회와 동일한 로직)
        const transformedData: Platform[] = response.data.map((item: StoreData) => ({
          id: `${item.store.storeId}-${item.partner.partnerId}`,
          storeId: item.store.storeId,
          partnerId: item.partner.partnerId,
          partnerName: item.partner.partnerName,
          name: item.store.storeName,
          category: item.partner.category,
          business: item.store.business,
          city: item.store.city,
          town: item.store.town,
          legalDong: item.store.legalDong,
          address: item.store.address,
          roadName: item.store.roadName,
          roadAddress: item.store.roadAddress,
          postCode: item.store.postCode,
          latitude: item.store.latitude,
          longitude: item.store.longitude,
          carrier: item.carrier,
          benefits: item.tierBenefit.map((benefit) => `${benefit.grade}: ${benefit.context}`),
          benefitDetails: item.tierBenefit,
          rating: 0, // API에서 제공하지 않으므로 기본값
          distance: item.distance,
          hasCoupon: item.store.hasCoupon,
          imageUrl: item.partner.image,
        }));

        setFavoriteStoreResults(transformedData);

        // 지도에 마커 표시 (KakaoMap에서 타이밍 처리)
        onRecommendationStoreResults?.(transformedData, true);
      } else {
        // 온라인 제휴처 등으로 매장 데이터가 없는 경우, 빈 배열로 설정
        setFavoriteStoreResults([]);
        // 지도에 빈 배열로 마커 업데이트
        onRecommendationStoreResults?.([], true);
      }

      // 관심 혜택 탭 내에서 StoreCard 리스트 표시
      setSelectedFavorite(favorite);
      setShowFavoriteStoreList(true);
    } catch (error) {
      console.error('즐겨찾기 매장 정보 조회 실패:', error);
      setFavoriteStoreError('매장 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsFavoriteStoreLoading(false);
    }
  };

  // 맞춤 AI 추천 클릭 핸들러
  const handlePersonalizedRecommendationClick = async (
    store: PersonalizedRecommendationItem,
    showSpeechBubble: boolean = true
  ) => {
    try {
      setIsRecommendationStoreLoading(true);
      setRecommendationStoreError(null);

      // 사용자 위치 정보 확인
      if (!userCoords) {
        setRecommendationStoreError('위치 정보를 가져올 수 없습니다.');
        return;
      }

      const response = await getRecommendationStoresByPartner(
        store.partnerName,
        userCoords.lat,
        userCoords.lng,
        userCoords.lat,
        userCoords.lng
      );

      // API 응답이 있으면 매장 목록 표시
      if (response.data && response.data.length > 0) {
        // API 응답을 Platform 형식으로 변환
        const transformedData: Platform[] = response.data.map((item: StoreData) => ({
          id: `${item.store.storeId}-${item.partner.partnerId}`,
          storeId: item.store.storeId,
          partnerId: item.partner.partnerId,
          partnerName: item.partner.partnerName,
          name: item.store.storeName,
          category: item.partner.category,
          business: item.store.business,
          city: item.store.city,
          town: item.store.town,
          legalDong: item.store.legalDong,
          address: item.store.address,
          roadName: item.store.roadName,
          roadAddress: item.store.roadAddress,
          postCode: item.store.postCode,
          latitude: item.store.latitude,
          longitude: item.store.longitude,
          carrier: item.carrier,
          benefits: item.tierBenefit.map((benefit) => `${benefit.grade}: ${benefit.context}`),
          benefitDetails: item.tierBenefit,
          rating: 0, // API에서 제공하지 않으므로 기본값
          distance: item.distance,
          hasCoupon: item.store.hasCoupon,
          imageUrl: item.partner.image,
        }));

        setRecommendationStoreResults(transformedData);

        // 지도에 마커 표시 (KakaoMap에서 타이밍 처리)
        onRecommendationStoreResults?.(transformedData, true);
      } else {
        // 온라인 제휴처 등으로 매장 데이터가 없는 경우, 빈 배열로 설정
        setRecommendationStoreResults([]);
        onRecommendationStoreResults?.([], true);
      }

      // 맞춤 AI 추천 탭 내에서 StoreCard 리스트 표시
      setSelectedPersonalizedRecommendation(store);
      setShowRecommendationStoreList(true);

      // SpeechBubble 표시 (추천 이유 설명) - chatroom에서 온 요청이 아닐 때만
      if (showSpeechBubble) {
        onShowSpeechBubble?.(store.reason, store.partnerName);
      }

      // BenefitDetailCard 표시를 위해 PersonalizedRecommendationItem의 benefitIds 사용
      if (store.benefitIds && store.benefitIds.length > 0 && onBenefitDetailRequest) {
        onBenefitDetailRequest(store.benefitIds);
      }
    } catch (error) {
      console.error('추천 매장 조회 API 호출 실패:', error);
      setRecommendationStoreError('매장 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsRecommendationStoreLoading(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // 카테고리 변경은 useFavoritesList 내부의 useEffect에서 자동 처리됨
  };

  // 맞춤 AI 추천에서 뒤로가기 핸들러
  const handlePersonalizedRecommendationStoreListBack = () => {
    setShowRecommendationStoreList(false);
    setSelectedPersonalizedRecommendation(null);
    setRecommendationStoreResults([]);
    setRecommendationStoreError(null);
  };

  // 즐겨찾기에서 뒤로가기 핸들러
  const handleFavoriteStoreListBack = () => {
    setShowFavoriteStoreList(false);
    setSelectedFavorite(null);
    setFavoriteStoreResults([]);
    setFavoriteStoreError(null);
  };

  // 채팅방 상태 변경 핸들러
  const handleChatStateChange = (isOpen: boolean) => {
    setIsChatOpen(isOpen);
  };

  // 탭별 다른 InfoBanner 메시지와 강조 텍스트
  const getBannerConfig = () => {
    const userName = user?.nickname ? `${user.nickname.slice(1)}님의` : '잇플님의';

    switch (activeTab) {
      case 'nearby':
        return {
          message: '근처 제휴처를 안내해드릴게요!',
          highlightText: '근처 제휴처',
        };
      case 'favorites':
        return {
          message: `${userName} 관심 혜택을 보여드릴게요!`,
          highlightText: '관심 혜택',
        };
      case 'ai':
        return {
          message: isChatOpen
            ? '무엇이든 질문형 AI 추천에 물어보세요!'
            : `${userName} 맞춤 AI 추천을 보여드릴게요!`,
          highlightText: isChatOpen ? '질문형 AI 추천' : '맞춤 AI 추천',
        };
      default:
        return {
          message: '근처 제휴처를 안내해드릴게요!',
          highlightText: '근처 제휴처',
        };
    }
  };

  const detailRegion = hasDetail ? (
    <div
      ref={detailRegionRef}
      role="region"
      tabIndex={-1}
      aria-label={
        hasInlineBenefitDetail ? '추천 혜택 상세' : `${selectedPlatform?.name ?? '매장'} 상세`
      }
      className={`${externalDetail ? 'relative' : 'absolute inset-0 z-10'} h-full overflow-hidden bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6154d9]`}
    >
      {hasInlineBenefitDetail && benefitDetailIds ? (
        <BenefitDetailCard
          benefitIds={benefitDetailIds}
          onClose={onBenefitDetailClose ?? (() => undefined)}
          className="h-full w-full max-w-none"
        />
      ) : selectedPlatform ? (
        <StoreDetailCard
          platform={selectedPlatform}
          onClose={handleDetailClose}
          closeMode={externalDetail ? 'dismiss' : 'back'}
        />
      ) : null}
    </div>
  ) : null;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white max-md:overflow-visible max-md:bg-transparent max-md:shadow-none">
      <div className="mx-4 mb-4 mt-4 flex min-h-0 flex-1 flex-col max-md:mx-0 max-md:mb-0 max-md:mt-0 max-md:w-full">
        <div
          className={isInlineDetail ? 'hidden' : 'shrink-0'}
          aria-hidden={isInlineDetail}
          inert={isInlineDetail}
        >
          <div className="mb-3 flex items-center justify-between gap-2 md:px-1">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-[#202124]">매장 찾기</h2>
            <span className="max-w-[150px] truncate rounded-full bg-[#f0edfc] px-3 py-1.5 text-xs font-semibold text-[#6154d9]">
              {currentLocation === '위치 정보 로딩 중...' ? '주변 매장' : currentLocation}
            </span>
          </div>
          {/* 검색 영역 - 데스크톱에서만 표시 */}
          <div
            className="flex-shrink-0 pb-3 max-md:touch-manipulation max-md:pb-2"
            // 모바일과 태블릿에서만 터치 이벤트 적용 (탭 및 헤더 영역)
            onTouchStart={isMobile || isTablet ? onTouchStart : undefined}
            onTouchMove={isMobile || isTablet ? onTouchMove : undefined}
            onTouchEnd={isMobile || isTablet ? onTouchEnd : undefined}
          >
            <div className="hidden md:block">
              <SearchSection
                onSearchChange={handleSearchChange}
                onKeywordSearch={onKeywordSearch}
                defaultValue={searchQuery}
              />
            </div>

            <div className="mt-2 mb-3 max-md:mx-0 max-md:mt-2 max-md:mb-2">
              <NavigationTabsSection
                tabs={mainTabs}
                activeTab={activeTab}
                onTabChange={onActiveTabChange}
              />
            </div>

            {activeTab === 'nearby' ? (
              <div className="mb-3 min-w-0">
                <p className="mb-1 px-1 text-xs font-medium text-[#686b73]">분야</p>
                <CategoryTabsSection
                  categories={categories}
                  selectedCategory={mapSelectedCategory}
                  onCategorySelect={onMapCategorySelect}
                  mode="map"
                />
              </div>
            ) : null}

            {activeTab !== 'nearby' && !(activeTab === 'favorites' && !isAuthenticated) && (
              <InfoBannerSection
                message={getBannerConfig().message}
                highlightText={getBannerConfig().highlightText}
                variant="secondary"
              />
            )}
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            ref={resultsRegionRef}
            role="region"
            tabIndex={-1}
            aria-label="검색 결과 목록"
            className={`flex h-full min-h-0 flex-col ${isInlineDetail ? 'invisible' : ''}`}
            aria-hidden={isInlineDetail}
            inert={isInlineDetail}
          >
            {/* 컨텐츠 영역 - 탭에 따라 다른 컴포넌트 렌더링 */}
            {activeTab === 'nearby' && (
              <StoreCardsSection
                platforms={platforms}
                isClusterView={isClusterView}
                selectedPlatform={selectedPlatform}
                onPlatformSelect={handleCardClick}
                currentLocation={currentLocation}
                isLoading={isLoading || isRecommendationStoreLoading}
                error={error || recommendationStoreError}
                mapUnavailable={mapUnavailable}
                searchQuery={recoverySearchQuery || searchQuery}
                displayMode="list"
              />
            )}

            {activeTab === 'favorites' && (
              <>
                {showFavoriteStoreList && isAuthenticated ? (
                  <StoreCardsSection
                    platforms={favoriteStoreResults}
                    selectedPlatform={selectedPlatform}
                    onPlatformSelect={handleCardClick}
                    currentLocation={selectedFavorite?.partnerName || '관심 혜택 매장'}
                    isLoading={isFavoriteStoreLoading}
                    error={favoriteStoreError}
                    backButton={{
                      onBack: handleFavoriteStoreListBack,
                      label: '돌아가기',
                    }}
                  />
                ) : (
                  <>
                    {/* 카테고리 탭 (관심 혜택용 - 사이드바 모드) */}
                    {isAuthenticated && (
                      <div className="mb-3 max-md:mx-0">
                        <CategoryTabsSection
                          categories={categories}
                          selectedCategory={selectedCategory}
                          onCategorySelect={handleCategorySelect}
                          mode="sidebar"
                          showNavigationButtons={true}
                        />
                      </div>
                    )}

                    {/* 즐겨찾기 스토어 리스트 */}
                    <div className="-mx-4 min-h-0 flex-1 overflow-x-hidden overflow-y-auto max-md:mx-0">
                      <FavoriteStoreList
                        favorites={favorites}
                        totalFavoritesCount={allFavorites.length}
                        onItemClick={handleFavoriteClick}
                        isLoading={isFavoritesLoading || isFavoriteStoreLoading}
                        error={favoritesError}
                        onRetry={refreshFavorites}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === 'ai' && (
              <>
                {showRecommendationStoreList ? (
                  <StoreCardsSection
                    platforms={recommendationStoreResults}
                    selectedPlatform={selectedPlatform}
                    onPlatformSelect={handleCardClick}
                    currentLocation={selectedPersonalizedRecommendation?.partnerName || '추천 매장'}
                    isLoading={isRecommendationStoreLoading}
                    error={recommendationStoreError}
                    backButton={{
                      onBack: handlePersonalizedRecommendationStoreListBack,
                      label: '돌아가기',
                    }}
                  />
                ) : (
                  <div className="-mx-4 min-h-0 flex-1 overflow-x-hidden overflow-y-auto max-md:mx-0 max-md:mb-2">
                    <PersonalizedRecommendationList
                      stores={personalizedRecommendations}
                      onItemClick={handlePersonalizedRecommendationClick}
                      isLoading={
                        isPersonalizedRecommendationsLoading || isRecommendationStoreLoading
                      }
                      error={personalizedRecommendationsError || recommendationStoreError}
                      onSearchPartner={(partnerName: string) => {
                        // 채팅에서 파트너 검색 시 PersonalizedRecommendationItem 형태로 변환하여 기존 로직 재사용
                        const fakeRecommendation: PersonalizedRecommendationItem = {
                          partnerName,
                          rank: 1,
                          reason: `${partnerName} 매장 정보를 보여드릴게요!`,
                          benefitIds: [],
                        };
                        handlePersonalizedRecommendationClick(fakeRecommendation, false); // speechBubble 비활성화
                      }}
                      onChangeTab={onActiveTabChange}
                      onBottomSheetReset={onBottomSheetReset}
                      onChatStateChange={handleChatStateChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
          {externalDetail
            ? detailContainer && detailRegion
              ? createPortal(detailRegion, detailContainer)
              : null
            : isInlineDetail
              ? detailRegion
              : null}
        </div>
      </div>
    </div>
  );
};

SidebarSection.displayName = 'SidebarSection';

export default React.memo(SidebarSection);
