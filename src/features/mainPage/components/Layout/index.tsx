import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import SidebarSection from '../SidebarSection';
import MapSection from '../MapSection';
import SearchSection from '../SidebarSection/SearchSection';
import SpeechBubble from '../SidebarSection/RecommendStoreList/SpeechBubble';
import BenefitDetailCard from '../SidebarSection/RecommendStoreList/BenefitDetailCard';
import MobileHeader from '../../../../components/MobileHeader';
import { Platform, MapLocation } from '../../types';
import { CATEGORIES, LAYOUT } from '../../constants';
import { useStoreData } from '../../hooks/useStoreData';
import { TbChevronLeft, TbChevronRight } from 'react-icons/tb';
import { useLocation } from 'react-router-dom';
import { useLayoutEffect } from 'react';
import { useResponsive } from '../../../../hooks/useResponsive';
import { disableScroll, enableScroll } from '../../../../utils/scrollLock';

const BOTTOM_SHEET_MIN_HEIGHT = 150;
const BOTTOM_SHEET_MID_HEIGHT = 300;
const BOTTOM_SHEET_VIEWPORT_OFFSET = 105;

/**
 * 메인페이지 레이아웃 컴포넌트
 * 사이드바와 지도 영역을 관리하고 두 영역 간의 데이터 연동 처리
 */

const MainPageLayout: React.FC = () => {
  // UI 상태 관리
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null); // 선택된 가맹점
  const [filteredPlatforms, setFilteredPlatforms] = useState<Platform[]>([]); // 검색 결과 가맹점 목록
  const [activeTab, setActiveTab] = useState<string>('nearby'); // 사이드바 활성 탭 ('주변 혜택', '관심 혜택', '잏AI 추천')
  const [searchQuery, setSearchQuery] = useState<string>(''); // 검색어 상태
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false); // 사이드바 접힘 상태

  // 바텀시트 상태 관리
  const [bottomSheetHeight, setBottomSheetHeight] = useState<number>(BOTTOM_SHEET_MIN_HEIGHT); // 바텀시트 높이
  const [maxBottomSheetHeight, setMaxBottomSheetHeight] = useState<number>(() =>
    typeof window === 'undefined'
      ? BOTTOM_SHEET_MID_HEIGHT
      : Math.max(BOTTOM_SHEET_MIN_HEIGHT, window.innerHeight - BOTTOM_SHEET_VIEWPORT_OFFSET)
  );
  const [isDragging, setIsDragging] = useState<boolean>(false); // 드래그 상태
  const [startY, setStartY] = useState<number>(0); // 드래그 시작 Y 좌표
  const [startHeight, setStartHeight] = useState<number>(0); // 드래그 시작 시 높이
  const [isAnimating, setIsAnimating] = useState(false);
  const { isMobile } = useResponsive();

  const location = useLocation();

  const mobileGuideMessage =
    activeTab === 'ai'
      ? '아래 시트를 올려 AI 추천과 대화를 확인해보세요.'
      : activeTab === 'favorites'
        ? '아래 시트를 올려 저장한 혜택을 빠르게 확인해보세요.'
        : '아래 시트를 올려 주변 혜택과 검색 결과를 확인해보세요.';

  const getMaxHeight = useCallback(() => maxBottomSheetHeight, [maxBottomSheetHeight]);

  const clampBottomSheetHeight = useCallback(
    (height: number) => Math.max(BOTTOM_SHEET_MIN_HEIGHT, Math.min(maxBottomSheetHeight, height)),
    [maxBottomSheetHeight]
  );

  // 스냅 포인트로 이동할 때 부드럽게 애니메이션
  const animateTo = useCallback(
    (target: number) => {
      const clampedTarget = clampBottomSheetHeight(target);
      setIsAnimating(true);
      setBottomSheetHeight(clampedTarget);
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    },
    [clampBottomSheetHeight]
  );

  // 바텀시트를 초기 상태로 리셋하는 함수
  const resetBottomSheet = useCallback(() => {
    animateTo(BOTTOM_SHEET_MIN_HEIGHT);
  }, [animateTo]);

  // 말풍선 상태
  const [speechBubble, setSpeechBubble] = useState<{
    isVisible: boolean;
    message: string;
    partnerName: string;
  }>({
    isVisible: false,
    message: '',
    partnerName: '',
  });

  // 혜택 상세 카드 상태
  const [benefitDetailCard, setBenefitDetailCard] = useState<{
    isVisible: boolean;
    benefitIds: number[];
  }>({
    isVisible: false,
    benefitIds: [],
  });

  // 지도 관련 상태
  const [currentMapLevel, setCurrentMapLevel] = useState<number>(2); // 지도 확대/축소 레벨
  const [currentMapCenter, setCurrentMapCenter] = useState<{ lat: number; lng: number } | null>(
    null
  ); // 지도 중심 좌표

  // 가맹점 데이터 및 API 상태 관리
  const {
    platforms: apiPlatforms, // API에서 가져온 가맹점 목록
    currentLocation, // 현재 위치 주소 텍스트
    isLoading, // 로딩 상태
    error, // 에러 상태
    selectedCategory, // 선택된 카테고리 (useStoreData에서 관리)
    updateLocationFromMap, // 지도에서 위치 이동 시 주소 업데이트
    filterByCategory, // 카테고리 필터링
    searchInCurrentMap, // 현재 지도 영역에서 검색
    searchByKeyword, // 키워드 검색
    updateToCurrentLocation, // 현재 위치 업데이트
    userCoords, // 사용자 초기 위치
    clearPlatforms, // 플랫폼 데이터 즉시 초기화
  } = useStoreData(currentMapCenter);

  // ItPlace AI 추천 결과 상태 (SidebarSection에서 올려받음)
  const [itplaceAiResults, setItplaceAiResults] = useState<Platform[]>([]);
  const [isShowingItplaceAiResults, setIsShowingItplaceAiResults] = useState(false);
  const [isCategoryChanging, setIsCategoryChanging] = useState(false);

  /**
   * 카테고리 선택 처리
   * 카테고리 변경 시 선택된 가맹점 및 검색 결과 초기화
   */
  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      setIsCategoryChanging(true); // 카테고리 변경 중 플래그
      setSelectedPlatform(null); // 선택된 가맹점 초기화
      setFilteredPlatforms([]); // 검색 결과 초기화
      setSearchQuery(''); // 검색어 초기화
      setIsShowingItplaceAiResults(false); // AI 결과 숨기기
      setItplaceAiResults([]); // AI 결과 초기화

      // 카테고리 변경 시 즉시 마커 제거를 위해 플랫폼 데이터 초기화
      clearPlatforms?.();

      // API 기반 카테고리 필터링 ('전체' -> null 변환)
      const categoryValue = categoryId === '전체' ? null : categoryId;

      // 실제 API 호출은 useStoreData에서 처리됨
      filterByCategory(categoryValue, currentMapLevel);
    },
    [filterByCategory, currentMapLevel, clearPlatforms]
  );

  // 플랫폼 선택 핸들러
  const handlePlatformSelect = useCallback(
    (platform: Platform | null) => {
      setSelectedPlatform(platform);

      // 마커 클릭 시 동작
      if (platform) {
        // 모바일에서 마커 클릭 시 바텀시트 자동으로 올리기
        if (window.innerWidth < 768) {
          animateTo(300); // 중간 높이로 올리기
        }
        // 데스크톱에서 마커 클릭 시 사이드바가 접혀있으면 펼치기
        else if (isSidebarCollapsed) {
          setIsSidebarCollapsed(false);
          // 지도 리사이즈를 위한 지연 처리
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 300);
        }
      }
    },
    [isSidebarCollapsed, animateTo]
  );

  // 사용자 위치 변경 핸들러 (초기 위치)
  const handleLocationChange = useCallback((location: MapLocation) => {
    // 초기 지도 중심 설정
    setCurrentMapCenter({ lat: location.latitude, lng: location.longitude });
    setFilteredPlatforms([]);
  }, []);

  // 지도 중심 변경 핸들러 (지도 드래그 시)
  const handleMapCenterChange = useCallback(
    (location: MapLocation) => {
      // 현재 지도 중심 저장 (API 호출은 안 함)
      setCurrentMapCenter({ lat: location.latitude, lng: location.longitude });
      updateLocationFromMap(location.latitude, location.longitude);
    },
    [updateLocationFromMap]
  );

  // 현재 위치로 이동 핸들러 (현재 위치 버튼 클릭 시)
  const handleLocationMove = useCallback(
    (latitude: number, longitude: number) => {
      // 사용자 위치 업데이트 및 데이터 재로드
      updateToCurrentLocation(latitude, longitude, currentMapLevel);
      // 지도 중심도 해당 위치로 이동
      setCurrentMapCenter({ lat: latitude, lng: longitude });
    },
    [updateToCurrentLocation, currentMapLevel]
  );

  // 지도 중심 이동 핸들러 (사이드바에서 호출)
  const handleMapCenterMove = useCallback((latitude: number, longitude: number) => {
    setCurrentMapCenter({ lat: latitude, lng: longitude });
  }, []);

  // 현 지도에서 검색 핸들러
  const handleSearchInMap = useCallback(() => {
    if (currentMapCenter && searchInCurrentMap) {
      searchInCurrentMap(currentMapCenter.lat, currentMapCenter.lng, currentMapLevel);
    }
  }, [currentMapCenter, currentMapLevel, searchInCurrentMap]);

  // 맵 레벨 변경 핸들러
  const handleMapLevelChange = useCallback((mapLevel: number) => {
    setCurrentMapLevel(mapLevel);
  }, []);

  // 마지막 검색어 추적 (중복 검색 방지용)
  const lastSearchedKeywordRef = useRef<string>('');

  // 키워드 검색 핸들러
  const handleKeywordSearch = useCallback(
    (keyword: string) => {
      // 동일한 검색어로 중복 검색 방지
      if (keyword === lastSearchedKeywordRef.current) {
        return;
      }

      lastSearchedKeywordRef.current = keyword;
      setSelectedPlatform(null); // 선택된 가맹점 초기화
      setFilteredPlatforms([]); // 검색 결과 초기화
      setSearchQuery(keyword); // 검색어 저장 (빈 문자열도 포함)
      setActiveTab('nearby'); // 주변 혜택 탭으로 전환

      // 현재 지도 중심이 있으면 사용, 없으면 사용자 초기 위치 사용
      if (currentMapCenter) {
        searchByKeyword(keyword, currentMapLevel, currentMapCenter.lat, currentMapCenter.lng);
      } else if (userCoords) {
        searchByKeyword(keyword, currentMapLevel, userCoords.lat, userCoords.lng);
      }
    },
    [searchByKeyword, currentMapLevel, currentMapCenter, userCoords]
  );

  // 말풍선 표시 핸들러 (검색 없이 말풍선만 표시)
  const handleShowSpeechBubble = useCallback((message: string, partnerName: string) => {
    setSpeechBubble({
      isVisible: true,
      message,
      partnerName,
    });
  }, []);

  // 말풍선 닫기 핸들러
  const handleSpeechBubbleClose = useCallback(() => {
    setSpeechBubble({
      isVisible: false,
      message: '',
      partnerName: '',
    });
  }, []);

  // URL 쿼리 파라미터에서 검색어를 처리하는 useEffect
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const searchKeyword = searchParams.get('search');

    if (searchKeyword && searchKeyword !== lastSearchedKeywordRef.current && userCoords) {
      // 검색어를 먼저 설정 (검색창에 표시)
      setSearchQuery(searchKeyword);

      // URL에서 검색어가 있고 사용자 위치가 준비되면 검색 실행
      handleKeywordSearch(searchKeyword);

      // URL에서 쿼리 파라미터 제거 (중복 검색 방지)
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('search');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [location.search, handleKeywordSearch, userCoords]);

  // 혜택 상세 카드 핸들러
  const handleBenefitDetailRequest = useCallback((benefitIds: number[]) => {
    setBenefitDetailCard({
      isVisible: true,
      benefitIds,
    });
  }, []);

  const handleBenefitDetailCardClose = useCallback(() => {
    setBenefitDetailCard({
      isVisible: false,
      benefitIds: [],
    });
  }, []);

  // 사이드바 토글 핸들러
  const handleSidebarToggle = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);

    // 지도 리사이즈를 위한 지연 처리
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300); // 애니메이션 완료 후
  }, []);

  // 바텀시트 드래그 핸들러

  // 바텀시트가 항상 탭바까지만 보이게
  // 🔥 useLayoutEffect에서 무조건 스크롤 + 바텀시트 초기화
  useLayoutEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    // 1. 즉시 overflow 설정하여 스크롤 차단
    disableScroll();

    // 2. 스크롤 위치 강제 초기화 (브라우저 스크롤 복원 비활성화로 이제 확실히 작동)
    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      if (document.scrollingElement) {
        document.scrollingElement.scrollTop = 0;
      }
    };

    // 3. 즉시 실행
    resetScroll();

    // 4. DOM 업데이트 후 재실행 및 바텀시트 초기화
    const timeoutId = requestAnimationFrame(() => {
      resetScroll();
      setBottomSheetHeight(BOTTOM_SHEET_MIN_HEIGHT);
    });

    return () => {
      cancelAnimationFrame(timeoutId);
      enableScroll();
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobile) return;

    const updateSheetBounds = () => {
      const nextMaxHeight = Math.max(
        BOTTOM_SHEET_MIN_HEIGHT,
        window.innerHeight - BOTTOM_SHEET_VIEWPORT_OFFSET
      );
      setMaxBottomSheetHeight(nextMaxHeight);
      setBottomSheetHeight((height) =>
        Math.max(BOTTOM_SHEET_MIN_HEIGHT, Math.min(nextMaxHeight, height))
      );
    };

    updateSheetBounds();
    window.addEventListener('resize', updateSheetBounds);
    window.addEventListener('orientationchange', updateSheetBounds);

    return () => {
      window.removeEventListener('resize', updateSheetBounds);
      window.removeEventListener('orientationchange', updateSheetBounds);
    };
  }, [isMobile]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setStartHeight(bottomSheetHeight);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = startY - e.touches[0].clientY;
    setBottomSheetHeight(clampBottomSheetHeight(startHeight + deltaY));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const snapPoints = [
      BOTTOM_SHEET_MIN_HEIGHT,
      Math.min(BOTTOM_SHEET_MID_HEIGHT, getMaxHeight()),
      getMaxHeight(),
    ];
    const closest = snapPoints.reduce((a, b) =>
      Math.abs(b - bottomSheetHeight) < Math.abs(a - bottomSheetHeight) ? b : a
    );
    animateTo(closest);
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      setStartY(e.clientY);
      setStartHeight(bottomSheetHeight);
    },
    [bottomSheetHeight]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      const currentY = e.clientY;
      const deltaY = startY - currentY;
      setBottomSheetHeight(clampBottomSheetHeight(startHeight + deltaY));
    },
    [isDragging, startY, startHeight, clampBottomSheetHeight]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);

    const snapPoints = [
      BOTTOM_SHEET_MIN_HEIGHT,
      Math.min(BOTTOM_SHEET_MID_HEIGHT, getMaxHeight()),
      getMaxHeight(),
    ];

    const closestSnapPoint = snapPoints.reduce((prev, curr) =>
      Math.abs(curr - bottomSheetHeight) < Math.abs(prev - bottomSheetHeight) ? curr : prev
    );

    animateTo(closestSnapPoint);
  }, [bottomSheetHeight, animateTo, getMaxHeight]);

  // ItPlace AI 추천 결과 핸들러
  const handleItplaceAiResults = useCallback((results: Platform[], isShowing: boolean) => {
    setItplaceAiResults(results);
    setIsShowingItplaceAiResults(isShowing);
  }, []);

  // apiPlatforms가 업데이트되면 카테고리 변경 완료
  useEffect(() => {
    if (isCategoryChanging && !isLoading) {
      setIsCategoryChanging(false);
    }
  }, [apiPlatforms, isLoading, isCategoryChanging]);

  // platforms 배열 안정화 (ItPlace AI 결과 우선 표시)
  const stablePlatforms = useMemo(() => {
    if (isShowingItplaceAiResults && itplaceAiResults.length > 0) {
      return itplaceAiResults;
    }
    // 카테고리 변경 중이면 빈 배열 반환 (이전 마커 제거)
    if (isCategoryChanging) {
      return [];
    }

    // 검색 결과가 있으면 검색 결과 사용
    if (filteredPlatforms.length > 0) {
      return filteredPlatforms;
    }

    // API 결과 반환 (빈 배열이어도 그대로 반환)
    return apiPlatforms;
  }, [
    filteredPlatforms,
    apiPlatforms,
    itplaceAiResults,
    isShowingItplaceAiResults,
    isCategoryChanging,
  ]);

  // 모바일에서 body 스크롤 방지
  useEffect(() => {
    if (isMobile) {
      disableScroll();
    }

    return () => {
      if (isMobile) {
        enableScroll();
      }
    };
  }, [isMobile]);

  return (
    <>
      {/* 데스크톱 레이아웃 */}
      <div className="hidden md:flex h-screen bg-grey01 p-6 relative overflow-hidden">
        {/* 사이드바 컨테이너 */}
        <div
          className={`flex-shrink-0 h-full transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? '-ml-6' : ''
          }`}
          style={{
            width: isSidebarCollapsed ? '0px' : `${LAYOUT.SIDEBAR_WIDTH + 24}px`, // padding 포함
            minWidth: isSidebarCollapsed ? '0px' : `${LAYOUT.SIDEBAR_MIN_WIDTH + 24}px`,
          }}
        >
          <div
            className={`h-full transition-all duration-300 ease-in-out ${
              isSidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            style={{
              width: `${LAYOUT.SIDEBAR_WIDTH}px`,
              minWidth: `${LAYOUT.SIDEBAR_MIN_WIDTH}px`,
            }}
          >
            <SidebarSection
              platforms={stablePlatforms}
              selectedPlatform={selectedPlatform}
              onPlatformSelect={handlePlatformSelect}
              currentLocation={currentLocation}
              isLoading={isLoading}
              error={error}
              activeTab={activeTab}
              onActiveTabChange={setActiveTab}
              onKeywordSearch={handleKeywordSearch}
              searchQuery={searchQuery}
              onMapCenterMove={handleMapCenterMove}
              onBenefitDetailRequest={handleBenefitDetailRequest}
              onShowSpeechBubble={handleShowSpeechBubble}
              userCoords={userCoords}
              onItplaceAiResults={handleItplaceAiResults}
              onSearchPartner={handleKeywordSearch}
              onBottomSheetReset={resetBottomSheet}
            />
          </div>
        </div>

        {/* 사이드바 토글 버튼 */}
        <button
          onClick={handleSidebarToggle}
          className={`absolute top-40 z-40 bg-white rounded-[18px] drop-shadow-basic px-1 py-3 hover:bg-grey01 transition-all duration-300 ease-in-out transform -translate-y-1/2 ${
            isSidebarCollapsed ? 'left-[0px]' : 'left-[395px]'
          }`}
          style={{ width: '24px', height: '60px' }}
        >
          {isSidebarCollapsed ? (
            <TbChevronRight size={14} className="text-grey05" />
          ) : (
            <TbChevronLeft size={14} className="text-grey05" />
          )}
        </button>

        {/* 맵 영역 */}
        <div
          className={`flex-1 h-full transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'pl-6' : ''
          }`}
        >
          <MapSection
            platforms={stablePlatforms}
            selectedPlatform={selectedPlatform}
            onPlatformSelect={handlePlatformSelect}
            onLocationChange={handleLocationChange}
            onMapCenterChange={handleMapCenterChange}
            onLocationMove={handleLocationMove}
            categories={CATEGORIES}
            selectedCategory={selectedCategory || '전체'}
            onCategorySelect={handleCategorySelect}
            onSearchInMap={handleSearchInMap}
            centerLocation={
              currentMapCenter
                ? { latitude: currentMapCenter.lat, longitude: currentMapCenter.lng }
                : null
            }
            onMapLevelChange={handleMapLevelChange}
            activeTab={activeTab}
          />
        </div>

        {/* 캐릭터 이미지 - 사이드바와 맵 사이 */}
        <div
          className={`absolute bottom-0 pointer-events-none z-30 overflow-hidden transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            left: isSidebarCollapsed ? '20px' : '400px',
            transform: 'translateX(-20%)',
            width: '380px',
            height: '200px', // 허리까지만 보이도록 절반 높이
          }}
        >
          <img
            src="/images/main/mainCharacter.webp"
            alt="잇플 캐릭터"
            className="w-full h-auto object-contain object-bottom"
            style={{ width: '190px', height: '190px' }}
          />
        </div>

        {/* 혜택 상세 카드 - 말풍선 위쪽에 위치 */}
        {benefitDetailCard.isVisible && !isSidebarCollapsed && (
          <div
            className="absolute z-30 transition-all duration-300 ease-in-out"
            style={{
              left: isSidebarCollapsed ? '120px' : '500px',
              bottom: '365px', // 말풍선보다 위쪽
              transform: 'translateX(-20%)',
              width: '410px',
            }}
          >
            <BenefitDetailCard
              benefitIds={benefitDetailCard.benefitIds}
              onClose={handleBenefitDetailCardClose}
            />
          </div>
        )}

        {/* 말풍선 - 캐릭터 위에 위치 */}
        {!isSidebarCollapsed && (
          <div
            className="absolute z-20 transition-all duration-300 ease-in-out"
            style={{
              left: isSidebarCollapsed ? '120px' : '500px',
              bottom: '200px', // 캐릭터 머리 위쪽
              transform: 'translateX(-20%)',
            }}
          >
            <SpeechBubble
              message={speechBubble.message}
              partnerName={speechBubble.partnerName}
              isVisible={speechBubble.isVisible}
              onClose={handleSpeechBubbleClose}
            />
          </div>
        )}
      </div>

      {/* 모바일 레이아웃 */}
      <div className="flex md:hidden flex-col h-screen bg-grey01 overflow-hidden">
        {/* 토스트 컨테이너 z-index 조정 */}
        <style>
          {`
            .Toastify__toast-container {
              z-index: 50000 !important;
            }
          `}
        </style>

        {/* 투명 MobileHeader with SearchSection */}
        <div className="absolute top-0 left-0 right-0 z-[10000]">
          <MobileHeader
            backgroundColor="bg-transparent"
            rightContent={
              <SearchSection
                onSearchChange={(query) => setSearchQuery(query)}
                onKeywordSearch={handleKeywordSearch}
                defaultValue={searchQuery}
              />
            }
          />
        </div>

        {/* 지도 - 전체 화면 */}
        <div className="absolute inset-0">
          <MapSection
            platforms={stablePlatforms}
            selectedPlatform={selectedPlatform}
            onPlatformSelect={handlePlatformSelect}
            onLocationChange={handleLocationChange}
            onMapCenterChange={handleMapCenterChange}
            onLocationMove={handleLocationMove}
            categories={CATEGORIES}
            selectedCategory={selectedCategory || '전체'}
            onCategorySelect={handleCategorySelect}
            onSearchInMap={handleSearchInMap}
            centerLocation={
              currentMapCenter
                ? { latitude: currentMapCenter.lat, longitude: currentMapCenter.lng }
                : null
            }
            onMapLevelChange={handleMapLevelChange}
            activeTab={activeTab}
          />

          {/* 바텀시트 */}
          <div
            className={`fixed left-0 right-0 bg-white rounded-t-[18px] shadow-lg z-[9998] flex flex-col ${
              isAnimating ? 'transition-all duration-300 ease-out' : ''
            }`}
            style={{
              height: `${bottomSheetHeight}px`,
              bottom: 0,
              minHeight: `${BOTTOM_SHEET_MIN_HEIGHT}px`,
              maxHeight: `${getMaxHeight()}px`,
              overflow: 'hidden',
              transition: isAnimating ? 'all 0.3s ease-out' : 'none',
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* 드래그 핸들 */}
            <div
              className="w-full h-6 flex items-center justify-center cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
            >
              <div className="w-8 h-1 bg-grey03 rounded-full" />
            </div>

            {isMobile && (
              <div className="px-5 pb-2 text-body-4 text-grey04">
                {bottomSheetHeight <= BOTTOM_SHEET_MIN_HEIGHT + 24
                  ? mobileGuideMessage
                  : '탭을 바꿔 주변 혜택, 관심 혜택, AI 추천을 살펴보세요.'}
              </div>
            )}

            {/* 사이드바 콘텐츠 */}
            <div
              className="flex-1 min-h-0 max-h-full"
              style={{
                overflowY: bottomSheetHeight > BOTTOM_SHEET_MIN_HEIGHT ? 'auto' : 'hidden',
              }}
            >
              <SidebarSection
                platforms={stablePlatforms}
                selectedPlatform={selectedPlatform}
                onPlatformSelect={handlePlatformSelect}
                currentLocation={currentLocation}
                isLoading={isLoading}
                error={error}
                activeTab={activeTab}
                onActiveTabChange={setActiveTab}
                onKeywordSearch={handleKeywordSearch}
                searchQuery={searchQuery}
                onMapCenterMove={handleMapCenterMove}
                onBenefitDetailRequest={handleBenefitDetailRequest}
                onShowSpeechBubble={handleShowSpeechBubble}
                userCoords={userCoords}
                onItplaceAiResults={handleItplaceAiResults}
                onSearchPartner={handleKeywordSearch}
                onBottomSheetReset={resetBottomSheet}
                // 모바일 드래그 이벤트 핸들러들 추가
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MainPageLayout;
