import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Platform } from '../../types';
import { FavoriteBenefit, PersonalizedRecommendationItem } from '../../types/api';
import { CATEGORIES } from '../../constants';
import SearchSection from './SearchSection';
import InfoBannerSection from './InfoBannerSection';
import NavigationTabsSection from './NavigationTabsSection';
import StoreCardsSection from './AllBenefit';
import FavoriteStoreList from './FavoriteStoreList';
import PersonalizedRecommendationList from './PersonalizedRecommendationList';
import StoreDetailCard from './StoreDetail';
import CategoryTabsSection from './CategoryTabsSection';
import { useFavoritesList } from '../../hooks/useFavoritesList';
import { getPersonalizedRecommendations } from '../../api/personalizedRecommendationApi';
import { getFavoritesList } from '../../api/favoritesListApi';
import { getRecommendationStoresByPartner } from '../../api/recommendationStoreApi';
import { StoreData } from '../../types/api';
import { RootState } from '../../../../store';
import { useResponsive } from '../../../../hooks/useResponsive';

interface Tab {
  id: string;
  label: string;
}

interface SidebarSectionProps {
  platforms: Platform[];
  selectedPlatform?: Platform | null;
  onPlatformSelect: (platform: Platform | null) => void;
  currentLocation: string;
  isLoading: boolean;
  error?: string | null;
  onSearchChange?: (query: string) => void;
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
  onKeywordSearch?: (keyword: string) => void;
  searchQuery?: string;
  onMapCenterMove?: (latitude: number, longitude: number) => void;
  onBenefitDetailRequest?: (benefitIds: number[]) => void;
  onShowSpeechBubble?: (message: string, partnerName: string) => void;
  userCoords?: { lat: number; lng: number } | null;
  onRecommendationStoreResults?: (results: Platform[], isShowing: boolean) => void;
  onSearchPartner?: (partnerName: string) => void;
  onBottomSheetReset?: () => void;
  // 모바일 드래그 이벤트 핸들러들 추가
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: () => void;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({
  platforms,
  selectedPlatform,
  onPlatformSelect,
  currentLocation,
  isLoading,
  error,
  onSearchChange,
  activeTab,
  onActiveTabChange,
  onKeywordSearch,
  searchQuery,
  onMapCenterMove,
  onBenefitDetailRequest,
  onShowSpeechBubble,
  userCoords,
  onRecommendationStoreResults,
  onBottomSheetReset,
  // 모바일 드래그 이벤트 핸들러들
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { isMobile, isTablet } = useResponsive();
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
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
  const { favorites, isLoading: isFavoritesLoading } = useFavoritesList(
    activeTab === 'favorites' ? selectedCategory : undefined
  );
  const [allFavorites, setAllFavorites] = useState<FavoriteBenefit[]>([]);

  // 즐겨찾기 매장 목록 표시 상태
  const [showFavoriteStoreList, setShowFavoriteStoreList] = useState(false);
  const [favoriteStoreResults, setFavoriteStoreResults] = useState<Platform[]>([]);
  const [selectedFavorite, setSelectedFavorite] = useState<FavoriteBenefit | null>(null);
  const [isFavoriteStoreLoading, setIsFavoriteStoreLoading] = useState(false);
  const [favoriteStoreError, setFavoriteStoreError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllFavorites = async () => {
      if (activeTab !== 'favorites') return;
      try {
        const data = await getFavoritesList({}); // 전체 카테고리
        setAllFavorites(data);
      } catch (error) {
        console.error('전체 즐겨찾기 조회 실패:', error);
        setAllFavorites([]);
      }
    };

    fetchAllFavorites();
  }, [activeTab]);

  // 맞춤 AI 추천 초기 로드 상태 관리 (nearby 방식과 완전히 동일)
  const [isInitialRecommendationsLoad, setIsInitialRecommendationsLoad] = useState(true);
  const isInitialRecommendationsLoadRef = useRef(isInitialRecommendationsLoad);
  isInitialRecommendationsLoadRef.current = isInitialRecommendationsLoad;

  const fetchPersonalizedRecommendations = useCallback(async () => {
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

  // 카드 클릭 시 상세보기로 전환 + 지도 중심 이동
  const handleCardClick = (platform: Platform) => {
    onPlatformSelect(platform);
    setViewMode('detail');
    // 해당 가맹점 위치로 지도 중심 이동
    onMapCenterMove?.(platform.latitude, platform.longitude);
  };

  // 상세보기에서 닫기
  const handleDetailClose = () => {
    setViewMode('list');
    onPlatformSelect(null); // selectedPlatform 초기화
  };

  // 외부에서 플랫폼 선택 시 (맵 마커 클릭 등) 상세보기로 전환
  useEffect(() => {
    if (selectedPlatform && viewMode === 'list') {
      setViewMode('detail');
    }
  }, [selectedPlatform, viewMode, activeTab]);

  // 플랫폼 선택이 해제되면 리스트 모드로 돌아가기
  useEffect(() => {
    if (!selectedPlatform && viewMode === 'detail') {
      setViewMode('list');
    }
  }, [selectedPlatform, viewMode]);

  const mainTabs: Tab[] = [
    { id: 'nearby', label: '주변 혜택' },
    { id: 'favorites', label: '관심 혜택' },
    { id: 'ai', label: '맞춤 AI 추천' },
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

        // 첫 번째 매장 위치로 지도 중심 이동 (마커가 보이도록)
        if (transformedData.length > 0) {
          const firstStore = transformedData[0];
          onMapCenterMove?.(firstStore.latitude, firstStore.longitude);
        }

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

        // 첫 번째 매장 위치로 지도 중심 이동 (마커가 보이도록)
        if (transformedData.length > 0) {
          const firstStore = transformedData[0];
          onMapCenterMove?.(firstStore.latitude, firstStore.longitude);
        }

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

  return (
    <div className="bg-white flex flex-col overflow-hidden w-full h-full border-r border-grey02 shadow-[4px_0_18px_rgba(16,17,20,0.08)] max-md:border-r-0 max-md:bg-transparent max-md:rounded-none max-md:drop-shadow-none max-md:shadow-none max-md:overflow-visible">
      {viewMode === 'list' ? (
        // 리스트 모드: 기존 UI
        <div className="flex flex-col mx-5 mt-[15px] mb-[18px] w-[330px] max-md:mx-0 max-md:w-full flex-1 min-h-0">
          {/* 검색 영역 - 데스크톱에서만 표시 */}
          <div
            className="pb-8 flex-shrink-0 max-md:touch-manipulation"
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

            <div className={`mb-4 ${searchQuery ? 'md:mt-0 mt-0' : 'md:mt-0 mt-0'} max-md:mx-0`}>
              <NavigationTabsSection
                tabs={mainTabs}
                activeTab={activeTab}
                onTabChange={onActiveTabChange}
              />
            </div>

            <InfoBannerSection
              message={getBannerConfig().message}
              highlightText={getBannerConfig().highlightText}
              variant="primary"
            />
          </div>

          {/* 컨텐츠 영역 - 탭에 따라 다른 컴포넌트 렌더링 */}
          {activeTab === 'nearby' && (
            <StoreCardsSection
              platforms={platforms}
              selectedPlatform={selectedPlatform}
              onPlatformSelect={handleCardClick}
              currentLocation={currentLocation}
              isLoading={isLoading || isRecommendationStoreLoading}
              error={error || recommendationStoreError}
              displayMode={searchQuery?.trim() ? 'list' : 'summary'}
            />
          )}

          {activeTab === 'favorites' && (
            <>
              {showFavoriteStoreList ? (
                <StoreCardsSection
                  platforms={favoriteStoreResults}
                  selectedPlatform={selectedPlatform}
                  onPlatformSelect={handleCardClick}
                  currentLocation={selectedFavorite?.partnerName || '즐겨찾기 매장'}
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
                  <div className="mb-3 max-md:mx-0">
                    <CategoryTabsSection
                      categories={CATEGORIES}
                      selectedCategory={selectedCategory}
                      onCategorySelect={handleCategorySelect}
                      mode="sidebar"
                      showNavigationButtons={true}
                    />
                  </div>

                  {/* 즐겨찾기 스토어 리스트 */}
                  <div
                    className="-mx-5 overflow-y-auto overflow-x-hidden flex flex-col max-md:mx-0"
                    style={{ height: 'calc(100vh - 360px)' }}
                  >
                    <FavoriteStoreList
                      favorites={favorites}
                      totalFavoritesCount={allFavorites.length}
                      onItemClick={handleFavoriteClick}
                      isLoading={isFavoritesLoading || isFavoriteStoreLoading}
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
                <div
                  className="-mx-5 overflow-y-auto overflow-x-hidden flex flex-col max-md:mx-0 max-md:mb-2"
                  style={{ height: 'calc(100vh - 48px)' }}
                >
                  <PersonalizedRecommendationList
                    stores={personalizedRecommendations}
                    onItemClick={handlePersonalizedRecommendationClick}
                    isLoading={isPersonalizedRecommendationsLoading || isRecommendationStoreLoading}
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
      ) : (
        // 상세 모드: StoreDetailCard만 전체 화면으로
        <div className="h-full overflow-y-auto">
          {selectedPlatform && (
            <StoreDetailCard platform={selectedPlatform} onClose={handleDetailClose} />
          )}
        </div>
      )}
    </div>
  );
};

export default SidebarSection;
