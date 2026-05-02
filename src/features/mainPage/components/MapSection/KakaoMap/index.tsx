import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { renderToString } from 'react-dom/server';
import { Platform, MapLocation } from '../../../types';
import {
  KakaoMap as KakaoMapType,
  KakaoMarker,
  KakaoMarkerClusterer,
  KakaoCustomOverlay,
  KakaoMouseEvent,
} from '../../../types/kakao';
import CustomMarker from './CustomMarker';
import { installCustomMarkerImageFallback } from './customMarkerFallback';

interface KakaoMapProps {
  platforms: Platform[];
  selectedPlatform?: Platform | null;
  onPlatformSelect: (platform: Platform | null) => void;
  onLocationChange?: (location: MapLocation) => void;
  onMapCenterChange?: (location: MapLocation) => void;
  centerLocation?: { latitude: number; longitude: number } | null;
  onMapLevelChange?: (mapLevel: number) => void;
  isRoadviewMode?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

interface MarkerDisplayPosition {
  latitude: number;
  longitude: number;
}

const EARTH_METERS_PER_DEGREE = 111_320;
const DUPLICATE_MARKER_RADIUS_METERS = 9;
const DUPLICATE_MARKER_RING_SIZE = 8;

const coordinateKey = (platform: Platform): string =>
  `${Number(platform.latitude).toFixed(12)}:${Number(platform.longitude).toFixed(12)}`;

const toDisplayPositionMap = (platforms: Platform[]): Map<string, MarkerDisplayPosition> => {
  const groups = new Map<string, Platform[]>();

  platforms.forEach((platform) => {
    if (!platform.latitude || !platform.longitude) {
      return;
    }
    const key = coordinateKey(platform);
    const group = groups.get(key);
    if (group) {
      group.push(platform);
      return;
    }
    groups.set(key, [platform]);
  });

  const displayPositions = new Map<string, MarkerDisplayPosition>();

  groups.forEach((group) => {
    if (group.length === 1) {
      const [platform] = group;
      displayPositions.set(platform.id, {
        latitude: platform.latitude,
        longitude: platform.longitude,
      });
      return;
    }

    const orderedGroup = [...group].sort((first, second) => first.storeId - second.storeId);
    orderedGroup.forEach((platform, index) => {
      const ring = Math.floor(index / DUPLICATE_MARKER_RING_SIZE);
      const indexInRing = index % DUPLICATE_MARKER_RING_SIZE;
      const countInRing = Math.min(
        DUPLICATE_MARKER_RING_SIZE,
        orderedGroup.length - ring * DUPLICATE_MARKER_RING_SIZE
      );
      const angle = (2 * Math.PI * indexInRing) / countInRing - Math.PI / 2;
      const radiusMeters = DUPLICATE_MARKER_RADIUS_METERS + ring * 6;
      const latitudeOffset = (Math.sin(angle) * radiusMeters) / EARTH_METERS_PER_DEGREE;
      const longitudeOffset =
        (Math.cos(angle) * radiusMeters) /
        (EARTH_METERS_PER_DEGREE * Math.cos((platform.latitude * Math.PI) / 180));

      displayPositions.set(platform.id, {
        latitude: platform.latitude + latitudeOffset,
        longitude: platform.longitude + longitudeOffset,
      });
    });
  });

  return displayPositions;
};

const KakaoMap: React.FC<KakaoMapProps> = ({
  platforms,
  selectedPlatform,
  onPlatformSelect,
  onLocationChange,
  onMapCenterChange,
  centerLocation,
  onMapLevelChange,
  isRoadviewMode = false,
  onMapClick,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMapType | null>(null);
  const markersRef = useRef<KakaoCustomOverlay[]>([]);
  const clustererRef = useRef<KakaoMarkerClusterer | null>(null);
  const isAnimatingRef = useRef<boolean>(false);
  const isZoomingRef = useRef<boolean>(false);
  const [userLocation, setUserLocation] = useState<MapLocation | null>(null);
  const [currentZoomLevel, setCurrentZoomLevel] = useState<number>(5);
  const [isMapInitialized, setIsMapInitialized] = useState<boolean>(false);
  const [visiblePlatforms, setVisiblePlatforms] = useState<Platform[]>([]);
  const displayPositionByPlatformId = useMemo(() => toDisplayPositionMap(platforms), [platforms]);

  // Viewport 내 플랫폼 필터링 함수
  const updateVisiblePlatforms = useCallback(() => {
    // 애니메이션 중이면 업데이트 중단
    if (isAnimatingRef.current || !mapRef.current) {
      return;
    }

    // platforms가 빈 배열이면 visiblePlatforms도 빈 배열로 설정
    if (!platforms.length) {
      setVisiblePlatforms([]);
      return;
    }

    const bounds = mapRef.current.getBounds();
    const filtered = platforms.filter((platform) => {
      // 좌표가 없는 플랫폼은 제외
      if (
        !platform.latitude ||
        !platform.longitude ||
        platform.latitude === 0 ||
        platform.longitude === 0
      ) {
        return false;
      }

      return bounds.contain(new window.kakao.maps.LatLng(platform.latitude, platform.longitude));
    });

    setVisiblePlatforms(filtered);
  }, [platforms]);

  // 사용자 현재 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(location);
          onLocationChange?.(location);
        },
        () => {
          // 기본 위치 (서울시청)
          const defaultLocation = { latitude: 37.5665, longitude: 126.978 };
          setUserLocation(defaultLocation);
          onLocationChange?.(defaultLocation);
        }
      );
    }
  }, [onLocationChange]);

  // 카카오맵 초기화
  useEffect(() => {
    if (!userLocation || !mapContainer.current || isMapInitialized) return;

    const initializeMap = () => {
      if (!window.kakao || !window.kakao.maps) {
        return;
      }

      // 컨테이너 크기가 확정될 때까지 대기
      const containerWidth = mapContainer.current?.offsetWidth;
      const containerHeight = mapContainer.current?.offsetHeight;

      if (!containerWidth || !containerHeight) {
        setTimeout(initializeMap, 100);
        return;
      }

      const options = {
        center: new window.kakao.maps.LatLng(userLocation.latitude, userLocation.longitude),
        level: 3,
      };

      const map = new window.kakao.maps.Map(mapContainer.current!, options);
      mapRef.current = map;

      // 클러스터러 초기화
      if (window.kakao.maps.MarkerClusterer) {
        const clusterer = new window.kakao.maps.MarkerClusterer({
          map: map,
          averageCenter: true,
          minLevel: 6, // 줌 레벨 7 이하에서만 클러스터링 적용 (축소된 상태)
          disableClickZoom: false,
          styles: [
            {
              // 1-9개 마커 (작은 크기)
              width: '40px',
              height: '40px',
              background: 'rgba(118, 56, 250, 0.8)',
              borderRadius: '20px',
              color: '#fff',
              textAlign: 'center',
              lineHeight: '40px',
              fontSize: '12px',
              fontWeight: 'bold',
            },
            {
              // 50-60개 마커 (중간 크기)
              width: '50px',
              height: '50px',
              background: 'rgba(118, 56, 250, 0.8)',
              borderRadius: '25px',
              color: '#fff',
              textAlign: 'center',
              lineHeight: '50px',
              fontSize: '14px',
              fontWeight: 'bold',
            },
            {
              // 60개 이상 마커 (큰 크기)
              width: '70px',
              height: '70px',
              background: 'rgba(118, 56, 250, 0.8)',
              borderRadius: '30px',
              color: '#fff',
              textAlign: 'center',
              lineHeight: '60px',
              fontSize: '16px',
              fontWeight: 'bold',
            },
            {
              // 100개 이상 마커 (큰 크기)
              width: '90px',
              height: '90px',
              background: 'rgba(118, 56, 250, 0.8)',
              borderRadius: '30px',
              color: '#fff',
              textAlign: 'center',
              lineHeight: '60px',
              fontSize: '16px',
              fontWeight: 'bold',
            },
          ],
        });

        // minClusterSize 설정 (1개부터 클러스터링)
        clusterer.setMinClusterSize(1);
        clustererRef.current = clusterer;
      }

      // 줌 시작 - 애니메이션 상태 시작
      window.kakao.maps.event.addListener(map, 'zoom_start', () => {
        isAnimatingRef.current = true;
        isZoomingRef.current = true;
      });

      // 줌 변경 완료 - 클러스터링 즉시 적용
      window.kakao.maps.event.addListener(map, 'zoom_changed', () => {
        const level = map.getLevel();
        setCurrentZoomLevel(level);
        onMapLevelChange?.(level);

        // 즉시 마커 업데이트 (클러스터링 전환을 위해)
        isAnimatingRef.current = false;
        isZoomingRef.current = false;
        updateVisiblePlatforms();

        // SearchInMapButton 표시를 위한 onMapCenterChange 호출
        if (onMapCenterChange) {
          const center = map.getCenter();
          const centerLocation: MapLocation = {
            latitude: center.getLat(),
            longitude: center.getLng(),
          };
          onMapCenterChange(centerLocation);
        }
      });

      // 드래그 시작 - 애니메이션 상태 시작
      window.kakao.maps.event.addListener(map, 'dragstart', () => {
        isAnimatingRef.current = true;
      });

      // 드래그 종료 - 애니메이션 완료 후 업데이트
      window.kakao.maps.event.addListener(map, 'dragend', () => {
        isAnimatingRef.current = false;

        // 줌으로 인한 dragend가 아닌 실제 드래그일 때만 onMapCenterChange 호출
        if (!isZoomingRef.current && onMapCenterChange) {
          const center = map.getCenter();
          const centerLocation: MapLocation = {
            latitude: center.getLat(),
            longitude: center.getLng(),
          };
          onMapCenterChange(centerLocation);
        }
        updateVisiblePlatforms();
      });

      // 지도 초기화 완료 표시
      setIsMapInitialized(true);

      // 초기화 후 크기 재조정
      setTimeout(() => {
        if (map && map.relayout) {
          map.relayout();
        }
      }, 100);
    };

    // 카카오맵 API가 이미 로드되어 있으면 바로 초기화
    if (window.kakao && window.kakao.maps) {
      initializeMap();
    } else {
      // 카카오맵 API 로드 대기
      const checkKakaoMaps = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          clearInterval(checkKakaoMaps);
          initializeMap();
        }
      }, 100);

      return () => clearInterval(checkKakaoMaps);
    }
  }, [userLocation, onMapCenterChange, onMapLevelChange, isMapInitialized, updateVisiblePlatforms]);

  // platforms 데이터가 변경되면 visiblePlatforms 업데이트 (지연 처리)
  useEffect(() => {
    // 애니메이션 중이거나 줌 중이면 잠시 후 업데이트
    if (isAnimatingRef.current || isZoomingRef.current) {
      setTimeout(() => {
        updateVisiblePlatforms();
      }, 250); // 지도 이동 완료 대기
    } else {
      updateVisiblePlatforms();
    }
  }, [platforms, updateVisiblePlatforms]);

  // 로드뷰 모드 클릭 이벤트 관리
  useEffect(() => {
    if (!mapRef.current || !onMapClick) return;

    let clickListener: ((mouseEvent?: KakaoMouseEvent) => void) | null = null;

    if (isRoadviewMode) {
      clickListener = (mouseEvent?: KakaoMouseEvent) => {
        if (mouseEvent && mouseEvent.latLng) {
          const clickedLatLng = mouseEvent.latLng;
          const lat = clickedLatLng.getLat();
          const lng = clickedLatLng.getLng();
          onMapClick(lat, lng);
        }
      };

      window.kakao.maps.event.addListener(
        mapRef.current,
        'click',
        clickListener as (...args: unknown[]) => void
      );
    }

    return () => {
      if (clickListener && mapRef.current && window.kakao.maps.event.removeListener) {
        window.kakao.maps.event.removeListener(
          mapRef.current,
          'click',
          clickListener as (...args: unknown[]) => void
        );
      }
    };
  }, [isRoadviewMode, onMapClick]);

  // 마커 업데이트 useEffect
  useEffect(() => {
    if (!mapRef.current || isAnimatingRef.current) return;

    // 렌더링할 플랫폼 결정: visiblePlatforms가 있으면 사용, 없으면 전체 platforms 사용
    const platformsToRender = visiblePlatforms.length > 0 ? visiblePlatforms : platforms;

    if (platformsToRender.length === 0) {
      // 데이터가 없으면 기존 마커만 제거
      if (clustererRef.current) {
        clustererRef.current.clear();
      }
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      return;
    }

    const newMarkers: KakaoMarker[] = [];
    const newCustomOverlays: KakaoCustomOverlay[] = [];

    // 클러스터링 활성화 여부 확인
    const isClusteringActive = currentZoomLevel >= 6 && clustererRef.current;

    // 새로운 마커들을 먼저 생성
    platformsToRender.forEach((platform) => {
      // 좌표가 없는 가맹점은 마커 표시 안함
      if (
        !platform.latitude ||
        !platform.longitude ||
        platform.latitude === 0 ||
        platform.longitude === 0
      ) {
        return;
      }

      const displayPosition = displayPositionByPlatformId.get(platform.id) ?? platform;
      const markerPosition = new window.kakao.maps.LatLng(
        displayPosition.latitude,
        displayPosition.longitude
      );

      // 줌 레벨에 따라 클러스터링 또는 개별 표시
      if (isClusteringActive) {
        // 클러스터링용 일반 마커 생성 (지도에 표시하지 않음)
        const clusterMarker = new window.kakao.maps.Marker({
          position: markerPosition,
        });

        // 클러스터 마커 클릭 이벤트
        window.kakao.maps.event.addListener(clusterMarker, 'click', () => {
          onPlatformSelect(platform);
        });

        newMarkers.push(clusterMarker);
      } else {
        // 개별 커스텀 마커만 표시 (클러스터링 비활성화 시에만)
        const isSelected = selectedPlatform?.id === platform.id;

        // React 컴포넌트를 HTML로 렌더링
        const markerHTML = renderToString(
          <CustomMarker imageUrl={platform.imageUrl} name={platform.name} isSelected={isSelected} />
        );

        // 개별 커스텀 마커 표시
        const customOverlay = new window.kakao.maps.CustomOverlay({
          position: markerPosition,
          content: markerHTML,
          yAnchor: 1, // 삼각형 끝부분이 좌표 위치가 되도록
          zIndex: isSelected ? 1000 : 1, // 선택된 마커가 가장 위에
        });

        // 마커 클릭 이벤트 (HTML 요소에 직접 이벤트 추가)
        const markerElement = document.createElement('div');
        markerElement.innerHTML = markerHTML;
        installCustomMarkerImageFallback(markerElement);
        markerElement.addEventListener('click', () => {
          onPlatformSelect(platform);
        });

        customOverlay.setContent(markerElement);
        newCustomOverlays.push(customOverlay);
      }
    });

    // 기존 마커 제거와 새 마커 추가를 동시에 처리
    if (isClusteringActive) {
      // 클러스터링 모드: 커스텀 오버레이 제거 후 클러스터 마커 추가
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      if (clustererRef.current) {
        clustererRef.current.clear();
        if (newMarkers.length > 0) {
          clustererRef.current.addMarkers(newMarkers);
        }
      }
    } else {
      // 커스텀 마커 모드: 클러스터 제거 후 커스텀 오버레이 추가
      if (clustererRef.current) {
        clustererRef.current.clear();
      }

      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      // 새로운 커스텀 오버레이들을 지도에 추가
      newCustomOverlays.forEach((overlay) => {
        overlay.setMap(mapRef.current);
      });
      markersRef.current = newCustomOverlays;
    }
  }, [
    visiblePlatforms,
    platforms,
    selectedPlatform,
    currentZoomLevel,
    onPlatformSelect,
    displayPositionByPlatformId,
  ]);

  // 선택된 플랫폼으로 지도 중심 이동
  useEffect(() => {
    if (!mapRef.current || !selectedPlatform) return;

    const moveLatLon = new window.kakao.maps.LatLng(
      selectedPlatform.latitude,
      selectedPlatform.longitude
    );
    mapRef.current.setCenter(moveLatLon);
  }, [selectedPlatform]);

  // centerLocation prop이 변경되면 지도 중심 이동
  useEffect(() => {
    if (!mapRef.current || !centerLocation) {
      return;
    }

    // 애니메이션 시작 표시
    isAnimatingRef.current = true;

    const moveLatLon = new window.kakao.maps.LatLng(
      centerLocation.latitude,
      centerLocation.longitude
    );
    mapRef.current.setCenter(moveLatLon);

    // 이동 완료 후 애니메이션 상태 해제 및 viewport 업데이트
    setTimeout(() => {
      isAnimatingRef.current = false;
      updateVisiblePlatforms();
    }, 200);
  }, [centerLocation, updateVisiblePlatforms]);

  return (
    <div className="w-full h-full">
      <div
        ref={mapContainer}
        className="w-full h-full rounded-[18px] max-md:rounded-none"
        style={{}}
      />
    </div>
  );
};

export default React.memo(KakaoMap);
