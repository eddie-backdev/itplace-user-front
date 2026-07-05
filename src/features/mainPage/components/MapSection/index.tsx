import React, { useState } from 'react';
import { Platform, Category, MapLocation, MapBounds, MapCluster } from '../../types';
import CategoryTabsSection from '../SidebarSection/CategoryTabsSection';
import KakaoMap from './KakaoMap';
import MapControls from './MapControls';
import RoadviewContainer from './Roadview/RoadviewContainer';
import { showToast } from '../../../../utils/toast';

interface MapSectionProps {
  platforms: Platform[];
  clusters?: MapCluster[];
  useServerClusters?: boolean;
  selectedPlatform?: Platform | null;
  onPlatformSelect: (platform: Platform | null) => void;
  onLocationChange?: (location: MapLocation) => void;
  onMapCenterChange?: (location: MapLocation) => void;
  onLocationMove: (latitude: number, longitude: number) => void;
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  onSearchInMap?: () => void;
  centerLocation?: { latitude: number; longitude: number } | null;
  onMapLevelChange?: (mapLevel: number) => void;
  onViewportChange?: (bounds: MapBounds, center: MapLocation, mapLevel: number) => void;
  activeTab: string;
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
  centerLocation,
  onMapLevelChange,
  onViewportChange,
  activeTab,
}) => {
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [isRoadviewMode, setIsRoadviewMode] = useState(false);
  const [roadviewClickedLatLng, setRoadviewClickedLatLng] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // 지도 중심 변경 핸들러 (드래그 감지)
  const handleMapCenterChange = (location: MapLocation) => {
    setShowSearchButton(activeTab !== 'nearby');
    onMapCenterChange?.(location);
  };

  const handleViewportChange = (bounds: MapBounds, center: MapLocation, mapLevel: number) => {
    setShowSearchButton(false);
    onViewportChange?.(bounds, center, mapLevel);
  };

  // 검색 실행 핸들러
  const handleSearchInMap = () => {
    setShowSearchButton(false); // 검색하면 버튼 숨김
    onSearchInMap?.();
  };

  // 로드뷰 토글 핸들러
  const handleRoadviewToggle = () => {
    if (isRoadviewMode) {
      // 로드뷰 모드 끄기
      setIsRoadviewMode(false);
      setRoadviewClickedLatLng(null);
    } else {
      // 로드뷰 모드 켜기
      setIsRoadviewMode(true);
      showToast('지도를 클릭하면 로드뷰를 확인할 수 있어요!', 'info');
    }
  };

  // 지도 클릭 핸들러 (로드뷰 모드일 때만)
  const handleMapClick = (lat: number, lng: number) => {
    if (isRoadviewMode) {
      setRoadviewClickedLatLng({ lat, lng });
      setIsRoadviewMode(false); // 로드뷰 표시 후 모드 해제
    }
  };

  // 로드뷰 닫기 핸들러
  const handleRoadviewClose = () => {
    setRoadviewClickedLatLng(null);
  };

  return (
    <div className="relative w-full h-full">
      {/* 카테고리 태그 - 주변 혜택 탭일 때만 지도 위 오버레이 */}
      {activeTab === 'nearby' && (
        <div className="absolute top-4 left-5 right-5 z-10 pointer-events-none overflow-hidden max-md:top-[50px] max-md:left-3 max-md:right-3">
          <div className="pointer-events-auto">
            <CategoryTabsSection
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={onCategorySelect}
              mode="map"
            />
          </div>
        </div>
      )}

      <KakaoMap
        platforms={platforms}
        clusters={clusters}
        useServerClusters={useServerClusters}
        selectedPlatform={selectedPlatform}
        onPlatformSelect={onPlatformSelect}
        onLocationChange={onLocationChange}
        onMapCenterChange={handleMapCenterChange}
        centerLocation={centerLocation}
        onMapLevelChange={onMapLevelChange}
        onViewportChange={handleViewportChange}
        isRoadviewMode={isRoadviewMode}
        onMapClick={handleMapClick}
      />

      <MapControls
        onLocationMove={onLocationMove}
        onSearchInMap={handleSearchInMap}
        showSearchButton={showSearchButton}
        isRoadviewMode={isRoadviewMode}
        onRoadviewToggle={handleRoadviewToggle}
      />

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
