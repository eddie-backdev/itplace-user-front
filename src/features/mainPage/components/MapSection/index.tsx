import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Category, MapLocation, MapBounds, MapCluster } from '../../types';
import CategoryTabsSection from '../SidebarSection/CategoryTabsSection';
import KakaoMap from './KakaoMap';
import MapControls from './MapControls';
import RoadviewContainer from './Roadview/RoadviewContainer';
import { showToast } from '../../../../utils/toast';
import { toast } from 'react-toastify';

const ROADVIEW_GUIDANCE_TOAST_ID = 'map-roadview-guidance';

interface MapSectionProps {
  platforms: Platform[];
  clusters?: MapCluster[];
  useServerClusters?: boolean;
  selectedPlatform?: Platform | null;
  onPlatformSelect: (platform: Platform | null) => void;
  onLocationChange?: (location: MapLocation) => void;
  onMapCenterChange?: (location: MapLocation, options?: { showSearchButton?: boolean }) => void;
  onLocationMove: (latitude: number, longitude: number) => void;
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  onSearchInMap?: () => void;
  searchQuery?: string;
  centerLocation?: { latitude: number; longitude: number } | null;
  initialCenterLocation?: { latitude: number; longitude: number } | null;
  initialMapLevel?: number;
  onZoomStart?: () => void;
  onMapLevelChange?: (mapLevel: number) => void;
  onViewportChange?: (bounds: MapBounds, center: MapLocation, mapLevel: number) => void;
  activeTab: string;
  mobileControlsBottomOffset?: number | string;
  mobileControlsTransitionEnabled?: boolean;
  mobileSheetBottomInset?: number;
  hideMobileCategory?: boolean;
  hideCategoryTabs?: boolean;
  hideMobileControls?: boolean;
  onRoadviewVisibilityChange?: (isVisible: boolean) => void;
}

const MapSection: React.FC<MapSectionProps> = ({
  platforms,
  clusters = [],
  useServerClusters = false,
  selectedPlatform,
  onPlatformSelect,
  onLocationChange,
  onMapCenterChange,
  onLocationMove,
  categories,
  selectedCategory,
  onCategorySelect,
  onSearchInMap,
  searchQuery,
  centerLocation,
  initialCenterLocation,
  initialMapLevel,
  onZoomStart,
  onMapLevelChange,
  onViewportChange,
  activeTab,
  mobileControlsBottomOffset,
  mobileControlsTransitionEnabled,
  mobileSheetBottomInset,
  hideMobileCategory = false,
  hideCategoryTabs = false,
  hideMobileControls = false,
  onRoadviewVisibilityChange,
}) => {
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [isRoadviewMode, setIsRoadviewMode] = useState(false);
  const [roadviewClickedLatLng, setRoadviewClickedLatLng] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (!roadviewClickedLatLng) return;
    return () => onRoadviewVisibilityChange?.(false);
  }, [onRoadviewVisibilityChange, roadviewClickedLatLng]);

  // 지도 중심 변경 핸들러 (드래그 감지)
  const handleMapCenterChange = useCallback(
    (location: MapLocation, options?: { showSearchButton?: boolean }) => {
      if (options?.showSearchButton !== false) {
        setShowSearchButton(activeTab !== 'nearby' || Boolean(searchQuery?.trim()));
      }
      onMapCenterChange?.(location, options);
    },
    [activeTab, onMapCenterChange, searchQuery]
  );

  const handleViewportChange = useCallback(
    (bounds: MapBounds, center: MapLocation, mapLevel: number) => {
      setShowSearchButton(activeTab !== 'nearby' || Boolean(searchQuery?.trim()));
      onViewportChange?.(bounds, center, mapLevel);
    },
    [activeTab, onViewportChange, searchQuery]
  );

  // 검색 실행 핸들러
  const handleSearchInMap = useCallback(() => {
    setShowSearchButton(false); // 검색하면 버튼 숨김
    onSearchInMap?.();
  }, [onSearchInMap]);

  // 로드뷰 토글 핸들러
  const handleRoadviewToggle = useCallback(() => {
    if (isRoadviewMode) {
      // 로드뷰 모드 끄기
      toast.dismiss(ROADVIEW_GUIDANCE_TOAST_ID);
      setIsRoadviewMode(false);
      setRoadviewClickedLatLng(null);
      onRoadviewVisibilityChange?.(false);
    } else {
      // 로드뷰 모드 켜기
      setIsRoadviewMode(true);
      showToast('지도를 클릭하면 로드뷰를 확인할 수 있어요!', 'info', {
        toastId: ROADVIEW_GUIDANCE_TOAST_ID,
      });
    }
  }, [isRoadviewMode, onRoadviewVisibilityChange]);

  // 지도 클릭 핸들러 (로드뷰 모드일 때만)
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (isRoadviewMode) {
        toast.dismiss(ROADVIEW_GUIDANCE_TOAST_ID);
        setRoadviewClickedLatLng({ lat, lng });
        setIsRoadviewMode(false); // 로드뷰 표시 후 모드 해제
        onRoadviewVisibilityChange?.(true);
      }
    },
    [isRoadviewMode, onRoadviewVisibilityChange]
  );

  // 로드뷰 닫기 핸들러
  const handleRoadviewClose = useCallback(() => {
    setRoadviewClickedLatLng(null);
    onRoadviewVisibilityChange?.(false);
  }, [onRoadviewVisibilityChange]);

  return (
    <div className="relative w-full h-full">
      {/* 카테고리 태그 - 주변 혜택 탭일 때만 지도 위 오버레이 */}
      {activeTab === 'nearby' && !roadviewClickedLatLng && !hideCategoryTabs && (
        <div
          aria-hidden={hideMobileCategory}
          inert={hideMobileCategory}
          className={`pointer-events-none absolute left-4 top-4 z-10 w-fit max-w-[calc(100%-2rem)] overflow-hidden rounded-xl border border-[#e6e6e3] bg-white p-1 shadow-[0_2px_8px_rgba(31,38,52,0.06)] md:max-lg:left-3 md:max-lg:top-3 md:max-lg:max-w-[calc(100%-1.5rem)] max-md:left-3 max-md:top-[64px] max-md:max-w-[calc(100%-1.5rem)] ${hideMobileCategory ? 'max-md:hidden' : ''}`}
        >
          <div className="pointer-events-auto min-w-0">
            <CategoryTabsSection
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={onCategorySelect}
              mode="map"
            />
          </div>
        </div>
      )}

      <div
        aria-hidden={Boolean(roadviewClickedLatLng)}
        inert={Boolean(roadviewClickedLatLng)}
        className="h-full w-full"
      >
        <KakaoMap
          platforms={platforms}
          clusters={clusters}
          useServerClusters={useServerClusters}
          selectedPlatform={selectedPlatform}
          onPlatformSelect={onPlatformSelect}
          searchQuery={searchQuery}
          mobileSheetBottomInset={mobileSheetBottomInset}
          onLocationChange={onLocationChange}
          onMapCenterChange={handleMapCenterChange}
          centerLocation={centerLocation}
          initialCenterLocation={initialCenterLocation}
          initialMapLevel={initialMapLevel}
          onZoomStart={onZoomStart}
          onMapLevelChange={onMapLevelChange}
          onViewportChange={handleViewportChange}
          isRoadviewMode={isRoadviewMode}
          onMapClick={handleMapClick}
        />
      </div>

      {!roadviewClickedLatLng && (
        <MapControls
          onLocationMove={onLocationMove}
          onSearchInMap={handleSearchInMap}
          showSearchButton={showSearchButton}
          isRoadviewMode={isRoadviewMode}
          onRoadviewToggle={handleRoadviewToggle}
          mobileBottomOffset={mobileControlsBottomOffset}
          mobileBottomTransitionEnabled={mobileControlsTransitionEnabled}
          hideMobileControls={hideMobileControls}
        />
      )}

      {/* 로드뷰 컨테이너 */}
      {roadviewClickedLatLng && (
        <RoadviewContainer
          clickedLatLng={roadviewClickedLatLng}
          onClose={handleRoadviewClose}
          onPlatformSelect={onPlatformSelect}
          selectedPlatform={selectedPlatform}
        />
      )}
    </div>
  );
};

export default MapSection;
