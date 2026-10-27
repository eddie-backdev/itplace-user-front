import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useSyncExternalStore,
} from 'react';
import SidebarSection from '../SidebarSection';
import MapSection from '../MapSection';
import SearchSection from '../SidebarSection/SearchSection';
import { Platform, MapLocation, MapBounds, MapCluster, MapViewportChangeReason } from '../../types';
import { toCategoryOptions } from '@/utils/referenceData';
import { useReferenceData } from '@/components/ReferenceDataProvider';
import { useStoreData } from '../../hooks/useStoreData';
import { getViewportChangeActions } from '../../utils/mapUtils';
import { TbChevronLeft } from 'react-icons/tb';
import styles from './Layout.module.css';
import { useLocation, useSearchParams } from '@/lib/navigation';
import { useLayoutEffect } from 'react';
import { useResponsive } from '../../../../hooks/useResponsive';
import { disableScroll, enableScroll } from '../../../../utils/scrollLock';
import {
  getKakaoMapSdkStatus,
  KAKAO_MAP_ERROR_EVENT,
  KAKAO_MAP_READY_EVENT,
} from '@/constants/kakaoMapSdk';

const BOTTOM_SHEET_MID_HEIGHT = 430;
const MOBILE_APP_TAB_BAR_HEIGHT = 64;
const MOBILE_MAP_MIN_EXPOSED_HEIGHT = 64;
const MOBILE_MAP_MAX_EXPOSED_HEIGHT = 200;
const MOBILE_MAP_CONTROLS_GAP = 12;
const EMPTY_MAP_CLUSTERS: MapCluster[] = [];
const WIDE_DETAIL_MEDIA_QUERY = '(min-width: 1920px)';
const subscribeWideDetail = (onChange: () => void) => {
  if (typeof window === 'undefined' || !window.matchMedia) return () => undefined;
  const media = window.matchMedia(WIDE_DETAIL_MEDIA_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};
const getWideDetailSnapshot = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.(WIDE_DETAIL_MEDIA_QUERY).matches);
const getWideDetailServerSnapshot = () => false;
const getBottomSheetMinHeight = (viewportHeight: number) =>
  Math.min(300, Math.max(128, viewportHeight - MOBILE_APP_TAB_BAR_HEIGHT - 280));
const getBottomSheetMaxHeight = (viewportHeight: number) => {
  const exposedMapHeight = Math.min(
    MOBILE_MAP_MAX_EXPOSED_HEIGHT,
    MOBILE_MAP_MIN_EXPOSED_HEIGHT + (Math.max(0, viewportHeight - 448) * 136) / 120
  );
  return Math.max(
    getBottomSheetMinHeight(viewportHeight),
    viewportHeight - MOBILE_APP_TAB_BAR_HEIGHT - exposedMapHeight
  );
};

/**
 * 메인페이지 레이아웃 컴포넌트
 * 사이드바와 지도 영역을 관리하고 두 영역 간의 데이터 연동 처리
 */

const MainPageLayout: React.FC = () => {
  const { data: referenceData } = useReferenceData();
  const categories = toCategoryOptions(referenceData);
  const [isMapUnavailable, setIsMapUnavailable] = useState(
    () => getKakaoMapSdkStatus() === 'error'
  );

  useEffect(() => {
    const handleMapError = () => setIsMapUnavailable(true);
    const handleMapReady = () => setIsMapUnavailable(false);
    window.addEventListener(KAKAO_MAP_ERROR_EVENT, handleMapError);
    window.addEventListener(KAKAO_MAP_READY_EVENT, handleMapReady);

    return () => {
      window.removeEventListener(KAKAO_MAP_ERROR_EVENT, handleMapError);
      window.removeEventListener(KAKAO_MAP_READY_EVENT, handleMapReady);
    };
  }, []);

  // UI 상태 관리
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null); // 선택된 가맹점
  const [isRoadviewOpen, setIsRoadviewOpen] = useState(false);
  const [filteredPlatforms, setFilteredPlatforms] = useState<Platform[]>([]); // 검색 결과 가맹점 목록
  const [activeTab, setActiveTab] = useState<string>('nearby'); // 사이드바 활성 탭 ('주변 혜택', '관심 혜택', '맞춤 AI 추천')
  const [searchQuery, setSearchQuery] = useState<string>(''); // 검색어 상태
  const hasEditedSearchQueryRef = useRef(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false); // 사이드바 접힘 상태

  // 바텀시트 상태 관리
  const [bottomSheetMinHeight, setBottomSheetMinHeight] = useState(() =>
    typeof window === 'undefined' ? 300 : getBottomSheetMinHeight(window.innerHeight)
  );
  const bottomSheetMinHeightRef = useRef(bottomSheetMinHeight);
  bottomSheetMinHeightRef.current = bottomSheetMinHeight;
  const [bottomSheetHeight, setBottomSheetHeight] = useState<number>(bottomSheetMinHeight); // 바텀시트 높이
  const [maxBottomSheetHeight, setMaxBottomSheetHeight] = useState<number>(() =>
    typeof window === 'undefined'
      ? BOTTOM_SHEET_MID_HEIGHT
      : getBottomSheetMaxHeight(window.innerHeight)
  );
  const [mobileViewportHeight, setMobileViewportHeight] = useState(() =>
    typeof window === 'undefined' ? 568 : window.innerHeight
  );
  const [isDragging, setIsDragging] = useState<boolean>(false); // 드래그 상태
  const [startY, setStartY] = useState<number>(0); // 드래그 시작 Y 좌표
  const [startHeight, setStartHeight] = useState<number>(0); // 드래그 시작 시 높이
  const [isAnimating, setIsAnimating] = useState(false);
  const didDragSheetHandleRef = useRef(false);
  const isMapZoomingRef = useRef(false);
  const hasInitializedMapViewportRef = useRef(false);
  const mapViewportSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastViewportSearchKeyRef = useRef<string>('');
  const { isMobile } = useResponsive();
  const isWideDetail = useSyncExternalStore(
    subscribeWideDetail,
    getWideDetailSnapshot,
    getWideDetailServerSnapshot
  );
  const [detailContainer, setDetailContainer] = useState<HTMLDivElement | null>(null);

  const location = useLocation();
  const [routeSearchParams] = useSearchParams();
  const recoverySearchQuery =
    searchQuery.trim() ||
    (!hasEditedSearchQueryRef.current ? routeSearchParams.get('search')?.trim() : '') ||
    '';

  const handleSearchChange = useCallback((query: string) => {
    hasEditedSearchQueryRef.current = true;
    setSearchQuery(query);
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const root = document.documentElement;
    root.style.setProperty(
      '--itplace-mobile-chat-launcher-bottom',
      `calc(var(--itplace-mobile-tab-bar-offset, ${MOBILE_APP_TAB_BAR_HEIGHT}px) + ${bottomSheetHeight}px + 12px)`
    );
    root.style.setProperty('--itplace-mobile-chat-launcher-right', '72px');
    root.style.setProperty(
      '--itplace-mobile-chat-launcher-display',
      mobileViewportHeight - MOBILE_APP_TAB_BAR_HEIGHT - bottomSheetHeight < 120 ? 'none' : 'inline-flex'
    );
    return () => {
      root.style.removeProperty('--itplace-mobile-chat-launcher-bottom');
      root.style.removeProperty('--itplace-mobile-chat-launcher-right');
      root.style.removeProperty('--itplace-mobile-chat-launcher-display');
    };
  }, [bottomSheetHeight, isMobile, mobileViewportHeight]);

  const getMaxHeight = useCallback(() => maxBottomSheetHeight, [maxBottomSheetHeight]);

  const clampBottomSheetHeight = useCallback(
    (height: number) => Math.max(bottomSheetMinHeight, Math.min(maxBottomSheetHeight, height)),
    [bottomSheetMinHeight, maxBottomSheetHeight]
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
    animateTo(bottomSheetMinHeight);
  }, [animateTo, bottomSheetMinHeight]);

  // 혜택 상세 카드 상태
  const [benefitDetailCard, setBenefitDetailCard] = useState<{
    isVisible: boolean;
    benefitIds: number[];
  }>({
    isVisible: false,
    benefitIds: [],
  });
  const hasDetail = Boolean(selectedPlatform || benefitDetailCard.isVisible);

  // 지도 관련 상태
  const [currentMapLevel, setCurrentMapLevel] = useState<number>(4); // 지도 확대/축소 레벨
  const [currentMapCenter, setCurrentMapCenter] = useState<{ lat: number; lng: number } | null>(
    null
  ); // 현재 지도 중심 좌표
  const [mapMoveTarget, setMapMoveTarget] = useState<{ lat: number; lng: number } | null>(null);
  const mapMoveCenterLocation = useMemo(
    () => (mapMoveTarget ? { latitude: mapMoveTarget.lat, longitude: mapMoveTarget.lng } : null),
    [mapMoveTarget]
  );
  const currentMapCenterLocation = useMemo(
    () =>
      currentMapCenter ? { latitude: currentMapCenter.lat, longitude: currentMapCenter.lng } : null,
    [currentMapCenter]
  );

  // 가맹점 데이터 및 API 상태 관리
  const {
    platforms: apiPlatforms, // API에서 가져온 가맹점 목록
    mapClusters, // 서버에서 집계한 지도 클러스터
    isMapClusterSnapshotReady, // 최신 서버 클러스터 스냅샷 준비 여부
    currentLocation, // 현재 위치 주소 텍스트
    isLoading, // 로딩 상태
    error, // 에러 상태
    selectedCategory, // 선택된 카테고리 (useStoreData에서 관리)
    updateLocationFromMap, // 지도에서 위치 이동 시 주소 업데이트
    filterByCategory, // 카테고리 필터링
    searchInCurrentMap, // 현재 지도 영역에서 검색
    searchInMapBounds, // 현재 지도 화면 영역에서 검색
    searchByKeyword, // 키워드 검색
    updateToCurrentLocation, // 현재 위치 업데이트
    userCoords, // 사용자 초기 위치
    cancelMapViewportRequest, // 줌 전환 전에 이전 viewport 요청 무효화
    clearPlatforms, // 플랫폼 데이터 즉시 초기화
  } = useStoreData(currentMapCenter);

  // 추천 매장 조회 결과 상태 (SidebarSection에서 올려받음)
  const [recommendationStoreResults, setRecommendationStoreResults] = useState<Platform[]>([]);
  const [isShowingRecommendationStoreResults, setIsShowingRecommendationStoreResults] =
    useState(false);
  const [isCategoryChanging, setIsCategoryChanging] = useState(false);

  /**
   * 카테고리 선택 처리
   * 카테고리 변경 시 선택된 가맹점 및 검색 결과 초기화
   */
  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      setIsCategoryChanging(true); // 카테고리 변경 중 플래그
      setSelectedPlatform(null); // 선택된 가맹점 초기화
      setBenefitDetailCard({ isVisible: false, benefitIds: [] });
      setFilteredPlatforms([]); // 검색 결과 초기화
      setSearchQuery(''); // 검색어 초기화
      setIsShowingRecommendationStoreResults(false); // 추천 매장 결과 숨기기
      setRecommendationStoreResults([]); // 추천 매장 결과 초기화

      // 상세 핀 모드에서는 즉시 비우고, 서버 클러스터 모드에서는 이전 스냅샷을
      // 유지해 최신 카테고리 응답과 원자적으로 교체한다.
      if (currentMapLevel < 5) {
        clearPlatforms?.();
      }

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
      setBenefitDetailCard({ isVisible: false, benefitIds: [] });

      if (!platform) {
        return;
      }

      // 모바일에서는 선택한 혜택 상세가 보이도록 바텀시트를 중간 높이로 올린다.
      if (window.innerWidth < 768) {
        animateTo(BOTTOM_SHEET_MID_HEIGHT);
        return;
      }

      // 데스크톱에서는 접힌 검색 결과 패널을 펼친 뒤 매장 상세를 표시한다.
      if (isSidebarCollapsed) {
        setIsSidebarCollapsed(false);
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 300);
      }
    },
    [animateTo, isSidebarCollapsed]
  );

  // 사용자 위치 변경 핸들러 (초기 위치)
  const handleLocationChange = useCallback((location: MapLocation) => {
    // 초기 지도 중심 설정
    setCurrentMapCenter(
      (current) => current ?? { lat: location.latitude, lng: location.longitude }
    );
    setFilteredPlatforms([]);
  }, []);

  // 지도 중심 변경 핸들러 (지도 드래그 시)
  const handleMapCenterChange = useCallback(
    (location: MapLocation) => {
      setMapMoveTarget(null);
      setCurrentMapCenter({ lat: location.latitude, lng: location.longitude });

      if (activeTab !== 'nearby' || searchQuery.trim()) {
        updateLocationFromMap(location.latitude, location.longitude);
      }
    },
    [activeTab, searchQuery, updateLocationFromMap]
  );

  // 현재 위치로 이동 핸들러 (현재 위치 버튼 클릭 시)
  const handleLocationMove = useCallback(
    (latitude: number, longitude: number) => {
      // 사용자 위치 업데이트 및 데이터 재로드
      updateToCurrentLocation(latitude, longitude, currentMapLevel);
      // 지도 중심도 해당 위치로 이동
      setCurrentMapCenter({ lat: latitude, lng: longitude });
      setMapMoveTarget({ lat: latitude, lng: longitude });
    },
    [updateToCurrentLocation, currentMapLevel]
  );

  // 현 지도에서 검색 핸들러
  const handleSearchInMap = useCallback(() => {
    if (currentMapCenter && searchInCurrentMap) {
      if (searchQuery.trim()) {
        searchByKeyword(searchQuery, currentMapLevel, currentMapCenter.lat, currentMapCenter.lng);
      } else {
        searchInCurrentMap(currentMapCenter.lat, currentMapCenter.lng, currentMapLevel);
      }
    }
  }, [currentMapCenter, currentMapLevel, searchInCurrentMap, searchByKeyword, searchQuery]);

  // 맵 레벨 변경 핸들러
  const handleMapLevelChange = useCallback((mapLevel: number) => {
    setCurrentMapLevel(mapLevel);
  }, []);

  const handleMapZoomStart = useCallback(() => {
    if (mapViewportSearchTimerRef.current) {
      clearTimeout(mapViewportSearchTimerRef.current);
      mapViewportSearchTimerRef.current = null;
    }

    lastViewportSearchKeyRef.current = '';
    cancelMapViewportRequest();
  }, [cancelMapViewportRequest]);

  // 지도 이동/줌 완료 후 현재 화면 기준 혜택 자동 재조회
  const handleMapViewportChange = useCallback(
    (
      bounds: MapBounds,
      center: MapLocation,
      mapLevel: number,
      reason: MapViewportChangeReason = 'interaction'
    ) => {
      hasInitializedMapViewportRef.current = true;
      setMapMoveTarget(null);
      setCurrentMapCenter({ lat: center.latitude, lng: center.longitude });
      setCurrentMapLevel(mapLevel);

      const viewportActions = getViewportChangeActions(reason, activeTab, searchQuery);
      if (!viewportActions.clearPendingSearch) return;

      if (mapViewportSearchTimerRef.current) {
        clearTimeout(mapViewportSearchTimerRef.current);
      }

      if (!viewportActions.searchBounds) return;

      const viewportSearchKey = [
        mapLevel,
        bounds.minLat.toFixed(5),
        bounds.minLng.toFixed(5),
        bounds.maxLat.toFixed(5),
        bounds.maxLng.toFixed(5),
        selectedCategory || '전체',
      ].join(':');

      if (viewportSearchKey === lastViewportSearchKeyRef.current) {
        return;
      }

      lastViewportSearchKeyRef.current = viewportSearchKey;

      const requestViewportSnapshot = async () => {
        const didCommit = await searchInMapBounds(
          bounds,
          center.latitude,
          center.longitude,
          mapLevel
        );

        if (!didCommit && lastViewportSearchKeyRef.current === viewportSearchKey) {
          lastViewportSearchKeyRef.current = '';
        }
      };

      if (mapLevel >= 5) {
        void requestViewportSnapshot();
        return;
      }

      mapViewportSearchTimerRef.current = setTimeout(() => {
        void requestViewportSnapshot();
      }, 350);
    },
    [activeTab, searchInMapBounds, searchQuery, selectedCategory]
  );

  useEffect(() => {
    return () => {
      if (mapViewportSearchTimerRef.current) {
        clearTimeout(mapViewportSearchTimerRef.current);
      }
    };
  }, []);

  // 마지막 검색어 추적 (중복 검색 방지용)
  const lastSearchedKeywordRef = useRef<string>('');

  const handleActiveTabChange = useCallback(
    (tab: string) => {
      if (tab !== activeTab) {
        setSelectedPlatform(null);
        setBenefitDetailCard({ isVisible: false, benefitIds: [] });
      }
      setActiveTab(tab);
    },
    [activeTab]
  );

  // 키워드 검색 핸들러
  const handleKeywordSearch = useCallback(
    (keyword: string) => {
      // 동일한 검색어로 중복 검색 방지
      if (keyword === lastSearchedKeywordRef.current) {
        return;
      }

      lastSearchedKeywordRef.current = keyword;
      setSelectedPlatform(null); // 선택된 가맹점 초기화
      setBenefitDetailCard({ isVisible: false, benefitIds: [] });
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

  // URL 쿼리 파라미터에서 검색어를 처리하는 useEffect
  useEffect(() => {
    const searchKeyword = routeSearchParams.get('search');

    if (searchKeyword && searchKeyword !== lastSearchedKeywordRef.current && userCoords) {
      // 검색어를 먼저 설정 (검색창에 표시)
      setSearchQuery(searchKeyword);

      // URL에서 검색어가 있고 사용자 위치가 준비되면 검색 실행
      handleKeywordSearch(searchKeyword);

      // URL에서 쿼리 파라미터 제거 (중복 검색 방지)
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete('search');
      window.history.replaceState(
        window.history.state,
        '',
        `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
      );
    }
  }, [handleKeywordSearch, routeSearchParams, userCoords]);

  // 혜택 상세 카드 핸들러
  const handleBenefitDetailRequest = useCallback(
    (benefitIds: number[]) => {
      setSelectedPlatform(null);
      setBenefitDetailCard({
        isVisible: true,
        benefitIds,
      });
      if (isSidebarCollapsed) {
        setIsSidebarCollapsed(false);
        setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
      }
    },
    [isSidebarCollapsed]
  );

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
      setBottomSheetHeight(bottomSheetMinHeightRef.current);
    });

    return () => {
      cancelAnimationFrame(timeoutId);
      enableScroll();
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobile) return;

    const updateSheetBounds = () => {
      if (isMapZoomingRef.current) {
        return;
      }

      const viewportHeight = window.innerHeight;
      setMobileViewportHeight(viewportHeight);
      const nextMinHeight = getBottomSheetMinHeight(viewportHeight);
      const nextMaxHeight = getBottomSheetMaxHeight(viewportHeight);
      setBottomSheetMinHeight(nextMinHeight);
      setMaxBottomSheetHeight(nextMaxHeight);
      setBottomSheetHeight((height) => Math.max(nextMinHeight, Math.min(nextMaxHeight, height)));
    };

    updateSheetBounds();
    window.addEventListener('resize', updateSheetBounds);
    window.addEventListener('orientationchange', updateSheetBounds);

    const handleMapZoomState = (event: Event) => {
      const customEvent = event as CustomEvent<{ isZooming?: boolean }>;
      isMapZoomingRef.current = Boolean(customEvent.detail?.isZooming);
    };

    window.addEventListener('itplace:map-zoom-state', handleMapZoomState);

    return () => {
      window.removeEventListener('resize', updateSheetBounds);
      window.removeEventListener('orientationchange', updateSheetBounds);
      window.removeEventListener('itplace:map-zoom-state', handleMapZoomState);
    };
  }, [isMobile]);

  const handleTouchStart = (e: React.TouchEvent) => {
    didDragSheetHandleRef.current = false;
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setStartHeight(bottomSheetHeight);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = startY - e.touches[0].clientY;
    if (Math.abs(deltaY) > 4) didDragSheetHandleRef.current = true;
    setBottomSheetHeight(clampBottomSheetHeight(startHeight + deltaY));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const snapPoints = [
      bottomSheetMinHeight,
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
      didDragSheetHandleRef.current = false;
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
      if (Math.abs(deltaY) > 4) didDragSheetHandleRef.current = true;
      setBottomSheetHeight(clampBottomSheetHeight(startHeight + deltaY));
    },
    [isDragging, startY, startHeight, clampBottomSheetHeight]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);

    const snapPoints = [
      bottomSheetMinHeight,
      Math.min(BOTTOM_SHEET_MID_HEIGHT, getMaxHeight()),
      getMaxHeight(),
    ];

    const closestSnapPoint = snapPoints.reduce((prev, curr) =>
      Math.abs(curr - bottomSheetHeight) < Math.abs(prev - bottomSheetHeight) ? curr : prev
    );

    animateTo(closestSnapPoint);
  }, [bottomSheetHeight, animateTo, getMaxHeight, bottomSheetMinHeight]);

  const handleSheetHandleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.detail > 0 && didDragSheetHandleRef.current) {
      didDragSheetHandleRef.current = false;
      return;
    }

    didDragSheetHandleRef.current = false;
    const snapPoints = [
      ...new Set([
        bottomSheetMinHeight,
        Math.min(BOTTOM_SHEET_MID_HEIGHT, getMaxHeight()),
        getMaxHeight(),
      ]),
    ];
    const currentIndex = snapPoints.reduce(
      (nearestIndex, point, index) =>
        Math.abs(point - bottomSheetHeight) < Math.abs(snapPoints[nearestIndex] - bottomSheetHeight)
          ? index
          : nearestIndex,
      0
    );
    animateTo(snapPoints[(currentIndex + 1) % snapPoints.length]);
  };

  const canExpandBottomSheet = getMaxHeight() > bottomSheetMinHeight;
  const sheetHandleLabel = !canExpandBottomSheet
    ? '목록 표시 중'
    : bottomSheetHeight >= getMaxHeight()
      ? '매장 목록 접기'
      : bottomSheetHeight > bottomSheetMinHeight
        ? '매장 목록 더 펼치기'
        : '매장 목록 펼치기';

  // 추천 매장 조회 결과 핸들러
  const handleRecommendationStoreResults = useCallback(
    (results: Platform[], isShowing: boolean) => {
      setRecommendationStoreResults(results);
      setIsShowingRecommendationStoreResults(isShowing);
    },
    []
  );

  // apiPlatforms가 업데이트되면 카테고리 변경 완료
  useEffect(() => {
    if (isCategoryChanging && !isLoading) {
      setIsCategoryChanging(false);
    }
  }, [apiPlatforms, isLoading, isCategoryChanging]);

  // platforms 배열 안정화 (추천 매장 조회 결과 우선 표시)
  const stablePlatforms = useMemo(() => {
    if (isShowingRecommendationStoreResults && recommendationStoreResults.length > 0) {
      return recommendationStoreResults;
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
    recommendationStoreResults,
    isShowingRecommendationStoreResults,
    isCategoryChanging,
  ]);

  const isServerClusterContext =
    activeTab === 'nearby' && !isShowingRecommendationStoreResults && !searchQuery.trim();

  // 4→5 진입 시에는 응답을 기다리지 않고 즉시 client cluster를 차단한다.
  // 5→4 전환 중에는 상세 핀 커밋이 readiness를 해제할 때까지 기존 서버 스냅샷을 유지한다.
  const shouldUseServerClusterMode =
    isServerClusterContext && (currentMapLevel >= 5 || isMapClusterSnapshotReady);

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
      {!isMobile && (
        <>
          <section className={styles.desktopPage} aria-label="내 주변 혜택">
            <div className={styles.desktopFrame}>
              {/* 지도는 남는 폭을 사용해 오른쪽 패널을 열고 닫아도 중심이 유지된다. */}
              <div className={styles.mapViewport}>
                <MapSection
                  platforms={stablePlatforms}
                  clusters={isServerClusterContext ? mapClusters : EMPTY_MAP_CLUSTERS}
                  useServerClusters={shouldUseServerClusterMode}
                  selectedPlatform={selectedPlatform}
                  onPlatformSelect={handlePlatformSelect}
                  onLocationChange={handleLocationChange}
                  onMapCenterChange={handleMapCenterChange}
                  onLocationMove={handleLocationMove}
                  categories={categories}
                  selectedCategory={selectedCategory || '전체'}
                  onCategorySelect={handleCategorySelect}
                  hideCategoryTabs
                  onSearchInMap={handleSearchInMap}
                  centerLocation={mapMoveCenterLocation}
                  initialCenterLocation={currentMapCenterLocation}
                  initialMapLevel={
                    hasInitializedMapViewportRef.current ? currentMapLevel : undefined
                  }
                  onZoomStart={handleMapZoomStart}
                  onMapLevelChange={handleMapLevelChange}
                  onViewportChange={handleMapViewportChange}
                  activeTab={activeTab}
                  searchQuery={recoverySearchQuery}
                  onRoadviewVisibilityChange={setIsRoadviewOpen}
                />
              </div>

              {/* 검색 결과는 왼쪽에 유지하고, 넓은 화면의 상세는 지도 오른쪽에 둔다. */}
              <div
                id="map-search-panel"
                aria-hidden={isSidebarCollapsed}
                inert={isSidebarCollapsed}
                className={`${styles.searchPanel} ${isSidebarCollapsed ? styles.searchPanelCollapsed : ''}`}
              >
                <div className={styles.searchPanelInner}>
                  <SidebarSection
                    platforms={stablePlatforms}
                    isClusterView={shouldUseServerClusterMode}
                    selectedPlatform={selectedPlatform}
                    onPlatformSelect={handlePlatformSelect}
                    currentLocation={currentLocation}
                    mapSelectedCategory={selectedCategory || '전체'}
                    onMapCategorySelect={handleCategorySelect}
                    isLoading={isLoading}
                    error={error}
                    activeTab={activeTab}
                    mapUnavailable={isMapUnavailable}
                    recoverySearchQuery={recoverySearchQuery}
                    onSearchChange={handleSearchChange}
                    onActiveTabChange={handleActiveTabChange}
                    onKeywordSearch={handleKeywordSearch}
                    searchQuery={searchQuery}
                    onBenefitDetailRequest={handleBenefitDetailRequest}
                    benefitDetailIds={
                      benefitDetailCard.isVisible ? benefitDetailCard.benefitIds : null
                    }
                    onBenefitDetailClose={handleBenefitDetailCardClose}
                    userCoords={userCoords}
                    onRecommendationStoreResults={handleRecommendationStoreResults}
                    onSearchPartner={handleKeywordSearch}
                    onBottomSheetReset={resetBottomSheet}
                    detailContainer={detailContainer}
                    externalDetail={isWideDetail && hasDetail}
                  />
                </div>
              </div>

              {isWideDetail && hasDetail && (
                <aside className={styles.detailPanel} aria-label="선택한 혜택 상세">
                  <div ref={setDetailContainer} className={styles.detailPanelInner} />
                </aside>
              )}

              <button
                type="button"
                onClick={handleSidebarToggle}
                aria-expanded={!isSidebarCollapsed}
                aria-controls="map-search-panel"
                aria-label={isSidebarCollapsed ? '검색 패널 열기' : '검색 패널 접기'}
                className={`${styles.panelToggle} ${isSidebarCollapsed ? styles.panelToggleCollapsed : ''}`}
              >
                <TbChevronLeft
                  size={16}
                  strokeWidth={2.2}
                  aria-hidden="true"
                  className={`${styles.panelToggleIcon} ${isSidebarCollapsed ? '' : styles.panelToggleIconOpen}`}
                />
              </button>
            </div>
          </section>
        </>
      )}

      {isMobile && (
        <>
          {/* 모바일 레이아웃 */}
          <div className="flex h-dvh flex-col overflow-hidden bg-warmCanvas md:hidden">
            {/* 토스트 컨테이너 z-index 조정 */}
            <style>
              {`
            .Toastify__toast-container {
              z-index: var(--itplace-layer-toast) !important;
            }
          `}
            </style>

            {/* 지도 탐색의 첫 행동인 검색을 상단에 고정한다. */}
            <div
              aria-hidden={isRoadviewOpen}
              inert={isRoadviewOpen}
              className={`absolute left-3 right-3 top-3 z-[10000] rounded-xl shadow-[0_5px_18px_rgba(36,35,33,0.10)] ${isRoadviewOpen ? 'invisible' : ''}`}
            >
              <SearchSection
                onSearchChange={handleSearchChange}
                onKeywordSearch={handleKeywordSearch}
                defaultValue={searchQuery}
              />
            </div>

            {/* 지도 - 전체 화면 */}
            <div className="absolute inset-0">
              <MapSection
                platforms={stablePlatforms}
                clusters={isServerClusterContext ? mapClusters : EMPTY_MAP_CLUSTERS}
                useServerClusters={shouldUseServerClusterMode}
                selectedPlatform={selectedPlatform}
                onPlatformSelect={handlePlatformSelect}
                onLocationChange={handleLocationChange}
                onMapCenterChange={handleMapCenterChange}
                onLocationMove={handleLocationMove}
                categories={categories}
                selectedCategory={selectedCategory || '전체'}
                onCategorySelect={handleCategorySelect}
                hideCategoryTabs
                onSearchInMap={handleSearchInMap}
                centerLocation={mapMoveCenterLocation}
                initialCenterLocation={currentMapCenterLocation}
                initialMapLevel={hasInitializedMapViewportRef.current ? currentMapLevel : undefined}
                onZoomStart={handleMapZoomStart}
                onMapLevelChange={handleMapLevelChange}
                onViewportChange={handleMapViewportChange}
                activeTab={activeTab}
                searchQuery={recoverySearchQuery}
                mobileControlsBottomOffset={`calc(var(--itplace-mobile-tab-bar-offset, ${MOBILE_APP_TAB_BAR_HEIGHT}px) + ${
                  bottomSheetHeight + MOBILE_MAP_CONTROLS_GAP
                }px)`}
                mobileControlsTransitionEnabled={isAnimating}
                mobileSheetBottomInset={MOBILE_APP_TAB_BAR_HEIGHT + bottomSheetHeight}
                hideMobileCategory={
                  isMobile &&
                  mobileViewportHeight - MOBILE_APP_TAB_BAR_HEIGHT - bottomSheetHeight < 122
                }
                hideMobileControls={
                  isMobile &&
                  mobileViewportHeight - MOBILE_APP_TAB_BAR_HEIGHT - bottomSheetHeight < 176
                }
                onRoadviewVisibilityChange={setIsRoadviewOpen}
              />

              {/* 바텀시트 */}
              <div
                aria-hidden={isRoadviewOpen}
                inert={isRoadviewOpen}
                className={`${isRoadviewOpen ? 'hidden' : 'fixed left-0 right-0 z-[9998] flex flex-col rounded-t-[24px] border-t border-warmBorder bg-warmSurface shadow-[0_-10px_30px_rgba(36,35,33,0.10)]'} ${
                  isAnimating ? 'transition-all duration-300 ease-out' : ''
                }`}
                style={{
                  height: `${bottomSheetHeight}px`,
                  bottom: `var(--itplace-mobile-tab-bar-offset, ${MOBILE_APP_TAB_BAR_HEIGHT}px)`,
                  minHeight: `${bottomSheetMinHeight}px`,
                  maxHeight: `${getMaxHeight()}px`,
                  overflow: 'hidden',
                  transition: isAnimating ? 'all 0.3s ease-out' : 'none',
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* 드래그 핸들 */}
                <button
                  type="button"
                  aria-label={sheetHandleLabel}
                  aria-expanded={bottomSheetHeight > bottomSheetMinHeight}
                  aria-controls="map-store-sheet-content"
                  disabled={!canExpandBottomSheet}
                  onClick={handleSheetHandleClick}
                  className="flex h-11 w-full shrink-0 select-none touch-none cursor-grab items-center justify-center gap-2 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--itplace-color-accent)] disabled:cursor-not-allowed"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleMouseDown}
                >
                  <div className="h-1 w-9 rounded-full bg-grey03" aria-hidden="true" />
                  <span className="text-xs font-medium text-[var(--itplace-color-text-secondary)]">
                    {sheetHandleLabel.replace('매장 ', '')}
                  </span>
                </button>

                {/* 사이드바 콘텐츠 */}
                <div
                  id="map-store-sheet-content"
                  className="flex-1 min-h-0 max-h-full"
                  style={{
                    overflowY: bottomSheetHeight > bottomSheetMinHeight ? 'auto' : 'hidden',
                  }}
                >
                  <SidebarSection
                    platforms={stablePlatforms}
                    isClusterView={shouldUseServerClusterMode}
                    selectedPlatform={selectedPlatform}
                    onPlatformSelect={handlePlatformSelect}
                    currentLocation={currentLocation}
                    mapSelectedCategory={selectedCategory || '전체'}
                    onMapCategorySelect={handleCategorySelect}
                    isLoading={isLoading}
                    error={error}
                    activeTab={activeTab}
                    mapUnavailable={isMapUnavailable}
                    recoverySearchQuery={recoverySearchQuery}
                    onActiveTabChange={handleActiveTabChange}
                    onKeywordSearch={handleKeywordSearch}
                    searchQuery={searchQuery}
                    onBenefitDetailRequest={handleBenefitDetailRequest}
                    benefitDetailIds={
                      benefitDetailCard.isVisible ? benefitDetailCard.benefitIds : null
                    }
                    onBenefitDetailClose={handleBenefitDetailCardClose}
                    userCoords={userCoords}
                    onRecommendationStoreResults={handleRecommendationStoreResults}
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
      )}
    </>
  );
};

export default MainPageLayout;
