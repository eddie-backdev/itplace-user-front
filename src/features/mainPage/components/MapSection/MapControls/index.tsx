import React from 'react';
import SearchInMapButton from './SearchInMapButton';
import CurrentLocationButton from './CurrentLocationButton';
import RoadviewButton from './RoadviewButton';

interface MapControlsProps {
  onLocationMove: (latitude: number, longitude: number) => void;
  onMapCenterMove?: (latitude: number, longitude: number) => void;
  onSearchInMap?: () => void;
  showSearchButton?: boolean;
  isRoadviewMode?: boolean;
  onRoadviewToggle?: () => void;
  mobileBottomOffset?: number;
  mobileBottomTransitionEnabled?: boolean;
}

const MapControls: React.FC<MapControlsProps> = ({
  onLocationMove,
  onMapCenterMove,
  onSearchInMap,
  showSearchButton = false,
  isRoadviewMode = false,
  onRoadviewToggle,
  mobileBottomOffset = 160,
  mobileBottomTransitionEnabled = false,
}) => {
  const mobileControlStyle = {
    '--mobile-map-controls-bottom': `${mobileBottomOffset}px`,
    transition: mobileBottomTransitionEnabled ? 'bottom 300ms ease-out' : 'none',
  } as React.CSSProperties;

  return (
    <>
      {/* 현재 지도에서 검색 버튼 */}
      {showSearchButton && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none max-md:top-[100px] max-md:bottom-auto">
          <div className="pointer-events-auto">
            <SearchInMapButton onClick={onSearchInMap} />
          </div>
        </div>
      )}

      {/* 로드뷰 버튼과 현재 위치 버튼 */}
      <div
        className="absolute bottom-6 right-6 z-[9997] pointer-events-none max-md:bottom-[var(--mobile-map-controls-bottom)] max-md:right-4"
        style={mobileControlStyle}
      >
        <div className="pointer-events-auto flex flex-col gap-3 max-md:flex-row max-md:gap-2">
          {/* 로드뷰 버튼 */}
          {onRoadviewToggle && (
            <RoadviewButton isRoadviewMode={isRoadviewMode} onToggle={onRoadviewToggle} />
          )}

          {/* 현재 위치로 이동 버튼 */}
          <CurrentLocationButton
            onLocationMove={onLocationMove}
            onMapCenterMove={onMapCenterMove}
          />
        </div>
      </div>
    </>
  );
};

export default MapControls;
