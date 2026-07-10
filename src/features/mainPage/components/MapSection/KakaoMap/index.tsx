import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { renderToString } from 'react-dom/server';
import { MapBounds, Platform, MapLocation, MapCluster } from '../../../types';
import {
  KakaoMap as KakaoMapType,
  KakaoMarker,
  KakaoMarkerClusterer,
  KakaoCustomOverlay,
  KakaoMouseEvent,
  KakaoLatLng,
} from '../../../types/kakao';
import CustomMarker from './CustomMarker';
import { installCustomMarkerImageFallback } from './customMarkerFallback';

interface KakaoMapProps {
  platforms: Platform[];
  clusters?: MapCluster[];
  useServerClusters?: boolean;
  selectedPlatform?: Platform | null;
  onPlatformSelect: (platform: Platform | null) => void;
  onLocationChange?: (location: MapLocation) => void;
  onMapCenterChange?: (location: MapLocation) => void;
  centerLocation?: { latitude: number; longitude: number } | null;
  initialCenterLocation?: { latitude: number; longitude: number } | null;
  initialMapLevel?: number;
  onMapLevelChange?: (mapLevel: number) => void;
  onViewportChange?: (bounds: MapBounds, center: MapLocation, mapLevel: number) => void;
  isRoadviewMode?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

interface MarkerDisplayPosition {
  latitude: number;
  longitude: number;
}

interface CustomMarkerRegistryEntry {
  overlay: KakaoCustomOverlay;
  element: HTMLDivElement;
  platform: Platform;
  positionKey: string;
  contentKey: string;
  clickHandler: () => void;
  isAttached: boolean;
}

interface ClusterMarkerRegistryEntry {
  marker: KakaoMarker;
  positionKey: string;
  isAttached: boolean;
}

interface ServerClusterRegistryEntry {
  overlay: KakaoCustomOverlay;
  element: HTMLButtonElement;
  cluster: MapCluster;
  positionKey: string;
  contentKey: string;
  clickHandler: () => void;
}

interface ReconcileMetrics {
  added: number;
  updated: number;
  removed: number;
  count: number;
  durationMs: number;
}

const EARTH_METERS_PER_DEGREE = 111_320;
const DUPLICATE_MARKER_RADIUS_METERS = 9;
const DUPLICATE_MARKER_RING_SIZE = 8;

const coordinateKey = (platform: Platform): string =>
  `${Number(platform.latitude).toFixed(12)}:${Number(platform.longitude).toFixed(12)}`;

const markerRegistryKey = (platform: Platform): string =>
  `${platform.id}:${platform.partnerId}:${platform.carrier ?? 'ALL'}`;

const resolveServerClusterStyle = (count: number) => {
  if (count <= 1) {
    return {
      size: 28,
      fontSize: 0,
      showCount: false,
      shadow: '0 5px 14px rgba(80, 40, 170, 0.18)',
    };
  }
  if (count < 10) {
    return {
      size: 40,
      fontSize: 14,
      showCount: true,
      shadow: '0 6px 16px rgba(80, 40, 170, 0.20)',
    };
  }
  if (count < 50) {
    return {
      size: 48,
      fontSize: 16,
      showCount: true,
      shadow: '0 7px 18px rgba(80, 40, 170, 0.22)',
    };
  }
  if (count < 100) {
    return {
      size: 56,
      fontSize: 17,
      showCount: true,
      shadow: '0 8px 20px rgba(80, 40, 170, 0.24)',
    };
  }
  return {
    size: 64,
    fontSize: 18,
    showCount: true,
    shadow: '0 10px 24px rgba(80, 40, 170, 0.26)',
  };
};

const updateServerClusterElement = (element: HTMLButtonElement, cluster: MapCluster) => {
  const style = resolveServerClusterStyle(cluster.count);

  element.setAttribute('aria-label', `${cluster.count}개 혜택 클러스터`);
  element.style.cssText = [
    `width:${style.size}px`,
    `height:${style.size}px`,
    'padding:0',
    'border:3px solid #FFFFFF',
    'border-radius:9999px',
    'background:radial-gradient(circle at 34% 28%, #9B78FF 0%, #7132F5 58%, #5020D6 100%)',
    'color:#FFFFFF',
    `box-shadow:${style.shadow}, inset 0 0 0 1px rgba(255,255,255,0.20)`,
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'font-weight:800',
    'cursor:pointer',
    'line-height:1',
  ].join(';');
  element.innerHTML = style.showCount
    ? `<span style="font-size:${style.fontSize}px">${cluster.count}</span>`
    : '<span style="width:8px;height:8px;border-radius:9999px;background:#FFFFFF;opacity:0.92"></span>';
};

const createServerClusterElement = (cluster: MapCluster) => {
  const element = document.createElement('button');
  element.type = 'button';
  updateServerClusterElement(element, cluster);
  return element;
};

const logReconcileMetrics = (mode: 'custom' | 'cluster' | 'server', metrics: ReconcileMetrics) => {
  if (!import.meta.env.DEV) return;

  console.debug(`[KakaoMap] ${mode} marker reconcile`, metrics);
};

const getReconcileDuration = (startedAt: number) =>
  import.meta.env.DEV ? performance.now() - startedAt : 0;

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
      displayPositions.set(markerRegistryKey(platform), {
        latitude: platform.latitude,
        longitude: platform.longitude,
      });
      return;
    }

    const orderedGroup = [...group].sort((first, second) => {
      const storeOrder = first.storeId - second.storeId;
      return storeOrder !== 0
        ? storeOrder
        : markerRegistryKey(first).localeCompare(markerRegistryKey(second));
    });
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

      displayPositions.set(markerRegistryKey(platform), {
        latitude: platform.latitude + latitudeOffset,
        longitude: platform.longitude + longitudeOffset,
      });
    });
  });

  return displayPositions;
};

const KakaoMap: React.FC<KakaoMapProps> = ({
  platforms,
  clusters = [],
  useServerClusters = false,
  selectedPlatform,
  onPlatformSelect,
  onLocationChange,
  onMapCenterChange,
  centerLocation,
  initialCenterLocation,
  initialMapLevel,
  onMapLevelChange,
  onViewportChange,
  isRoadviewMode = false,
  onMapClick,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMapType | null>(null);
  const customMarkerRegistryRef = useRef(new Map<string, CustomMarkerRegistryEntry>());
  const clusterMarkerRegistryRef = useRef(new Map<string, ClusterMarkerRegistryEntry>());
  const clustererRef = useRef<KakaoMarkerClusterer | null>(null);
  const serverClusterRegistryRef = useRef(new Map<string, ServerClusterRegistryEntry>());
  const isAnimatingRef = useRef<boolean>(false);
  const isZoomingRef = useRef<boolean>(false);
  const isClusterModeRef = useRef<boolean>(false);
  const areMarkersHiddenRef = useRef<boolean>(false);
  const markerRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zoomSettledTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressDragEndUntilRef = useRef<number>(0);
  const platformsRef = useRef(platforms);
  const onPlatformSelectRef = useRef(onPlatformSelect);
  const onLocationChangeRef = useRef(onLocationChange);
  const onMapCenterChangeRef = useRef(onMapCenterChange);
  const onMapLevelChangeRef = useRef(onMapLevelChange);
  const onViewportChangeRef = useRef(onViewportChange);
  const initialCenterLocationRef = useRef(initialCenterLocation);
  const initialMapLevelRef = useRef(initialMapLevel);
  platformsRef.current = platforms;
  onPlatformSelectRef.current = onPlatformSelect;
  onLocationChangeRef.current = onLocationChange;
  onMapCenterChangeRef.current = onMapCenterChange;
  onMapLevelChangeRef.current = onMapLevelChange;
  onViewportChangeRef.current = onViewportChange;
  initialCenterLocationRef.current = initialCenterLocation;
  initialMapLevelRef.current = initialMapLevel;
  const [userLocation, setUserLocation] = useState<MapLocation | null>(null);
  const [mapInitializationVersion, setMapInitializationVersion] = useState(0);
  const [isClusterMode, setIsClusterMode] = useState<boolean>(false);
  const [visiblePlatforms, setVisiblePlatforms] = useState<Platform[] | null>(null);
  const displayPositionByMarkerKey = useMemo(
    () =>
      isClusterMode ? new Map<string, MarkerDisplayPosition>() : toDisplayPositionMap(platforms),
    [isClusterMode, platforms]
  );

  const setCustomMarkersVisibility = useCallback((visibility: 'visible' | 'hidden') => {
    areMarkersHiddenRef.current = visibility === 'hidden';

    customMarkerRegistryRef.current.forEach(({ overlay }) => {
      const content = overlay.getContent();
      const markerElement =
        content.querySelector<HTMLElement>('[data-itplace-map-marker="true"]') ?? content;

      markerElement.style.visibility = visibility;
      markerElement.style.pointerEvents = visibility === 'hidden' ? 'none' : '';
    });
  }, []);

  const revealCustomMarkersAfterZoom = useCallback(() => {
    if (markerRevealTimerRef.current) {
      clearTimeout(markerRevealTimerRef.current);
    }

    markerRevealTimerRef.current = setTimeout(() => {
      setCustomMarkersVisibility('visible');
    }, 120);
  }, [setCustomMarkersVisibility]);

  const notifyMapZoomState = useCallback((isZooming: boolean) => {
    window.dispatchEvent(new CustomEvent('itplace:map-zoom-state', { detail: { isZooming } }));
  }, []);

  const settleZoomStateAfterDelay = useCallback(() => {
    if (zoomSettledTimerRef.current) {
      clearTimeout(zoomSettledTimerRef.current);
    }

    zoomSettledTimerRef.current = setTimeout(() => {
      isZoomingRef.current = false;
      notifyMapZoomState(false);
    }, 300);
  }, [notifyMapZoomState]);

  useEffect(() => {
    const customMarkerRegistry = customMarkerRegistryRef.current;
    const clusterMarkerRegistry = clusterMarkerRegistryRef.current;
    const serverClusterRegistry = serverClusterRegistryRef.current;

    return () => {
      if (markerRevealTimerRef.current) {
        clearTimeout(markerRevealTimerRef.current);
      }
      if (zoomSettledTimerRef.current) {
        clearTimeout(zoomSettledTimerRef.current);
      }
      customMarkerRegistry.forEach(({ overlay, element, clickHandler }) => {
        element.removeEventListener('click', clickHandler);
        overlay.setMap(null);
      });
      customMarkerRegistry.clear();
      clusterMarkerRegistry.clear();
      serverClusterRegistry.forEach(({ overlay, element, clickHandler }) => {
        element.removeEventListener('click', clickHandler);
        overlay.setMap(null);
      });
      serverClusterRegistry.clear();
    };
  }, []);

  const notifyViewportChange = useCallback(() => {
    if (!mapRef.current || !onViewportChangeRef.current) {
      return;
    }

    const map = mapRef.current;
    const bounds = map.getBounds();
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();
    const center = map.getCenter();

    onViewportChangeRef.current(
      {
        minLat: southWest.getLat(),
        minLng: southWest.getLng(),
        maxLat: northEast.getLat(),
        maxLng: northEast.getLng(),
      },
      {
        latitude: center.getLat(),
        longitude: center.getLng(),
      },
      map.getLevel()
    );
  }, []);

  // Viewport 내 플랫폼 필터링 함수
  const updateVisiblePlatforms = useCallback(() => {
    // 애니메이션 중이면 업데이트 중단
    if (isAnimatingRef.current || !mapRef.current) {
      return;
    }

    const latestPlatforms = platformsRef.current;

    // platforms가 빈 배열이면 visiblePlatforms도 빈 배열로 설정
    if (!latestPlatforms.length) {
      setVisiblePlatforms([]);
      return;
    }

    const bounds = mapRef.current.getBounds();
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();
    const minLat = southWest.getLat();
    const minLng = southWest.getLng();
    const maxLat = northEast.getLat();
    const maxLng = northEast.getLng();

    const filtered = latestPlatforms.filter((platform) => {
      // 좌표가 없는 플랫폼은 제외
      if (
        !platform.latitude ||
        !platform.longitude ||
        platform.latitude === 0 ||
        platform.longitude === 0
      ) {
        return false;
      }

      return (
        platform.latitude >= minLat &&
        platform.latitude <= maxLat &&
        platform.longitude >= minLng &&
        platform.longitude <= maxLng
      );
    });

    setVisiblePlatforms(filtered);
  }, []);

  // 사용자 현재 위치 가져오기
  useEffect(() => {
    let isCanceled = false;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isCanceled) return;

          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(location);
          onLocationChangeRef.current?.(location);
        },
        () => {
          if (isCanceled) return;

          // 기본 위치 (서울시청)
          const defaultLocation = { latitude: 37.5665, longitude: 126.978 };
          setUserLocation(defaultLocation);
          onLocationChangeRef.current?.(defaultLocation);
        }
      );
    }

    return () => {
      isCanceled = true;
    };
  }, []);

  // 카카오맵 초기화
  useEffect(() => {
    if (!userLocation || !mapContainer.current || mapRef.current) return;

    let isDisposed = false;
    let initializeRetryTimer: ReturnType<typeof setTimeout> | null = null;
    let initialViewportTimer: ReturnType<typeof setTimeout> | null = null;
    let kakaoMapsCheckInterval: ReturnType<typeof setInterval> | null = null;
    let initializedMap: KakaoMapType | null = null;
    const mapEventListeners: Array<{
      type: string;
      handler: (...args: unknown[]) => void;
    }> = [];

    const addMapEventListener = (
      map: KakaoMapType,
      type: string,
      handler: (...args: unknown[]) => void
    ) => {
      window.kakao.maps.event.addListener(map, type, handler);
      mapEventListeners.push({ type, handler });
    };

    const initializeMap = () => {
      if (isDisposed || mapRef.current || !window.kakao || !window.kakao.maps) {
        return;
      }

      // 컨테이너 크기가 확정될 때까지 대기
      const containerWidth = mapContainer.current?.offsetWidth;
      const containerHeight = mapContainer.current?.offsetHeight;

      if (!containerWidth || !containerHeight) {
        if (initializeRetryTimer) {
          clearTimeout(initializeRetryTimer);
        }
        initializeRetryTimer = setTimeout(initializeMap, 100);
        return;
      }

      const initialCenter = initialCenterLocationRef.current ?? userLocation;
      const options = {
        center: new window.kakao.maps.LatLng(initialCenter.latitude, initialCenter.longitude),
        level: initialMapLevelRef.current ?? 3,
      };

      const map = new window.kakao.maps.Map(mapContainer.current!, options);
      initializedMap = map;
      mapRef.current = map;
      setMapInitializationVersion((version) => version + 1);

      // 클러스터러 초기화
      if (window.kakao.maps.MarkerClusterer) {
        const clusterer = new window.kakao.maps.MarkerClusterer({
          map: map,
          averageCenter: true,
          minLevel: 5, // 줌 레벨 5부터 클러스터링 적용 (한 단계 더 이른 전환)
          disableClickZoom: false,
          styles: [
            {
              // 1-9개 마커 (작은 크기)
              width: '40px',
              height: '40px',
              background: 'rgba(113, 50, 245, 0.86)',
              borderRadius: '20px',
              color: '#FFFFFF',
              textAlign: 'center',
              lineHeight: '40px',
              fontSize: '12px',
              fontWeight: 'bold',
            },
            {
              // 50-60개 마커 (중간 크기)
              width: '50px',
              height: '50px',
              background: 'rgba(113, 50, 245, 0.86)',
              borderRadius: '25px',
              color: '#FFFFFF',
              textAlign: 'center',
              lineHeight: '50px',
              fontSize: '14px',
              fontWeight: 'bold',
            },
            {
              // 60개 이상 마커 (큰 크기)
              width: '70px',
              height: '70px',
              background: 'rgba(113, 50, 245, 0.86)',
              borderRadius: '30px',
              color: '#FFFFFF',
              textAlign: 'center',
              lineHeight: '60px',
              fontSize: '16px',
              fontWeight: 'bold',
            },
            {
              // 100개 이상 마커 (큰 크기)
              width: '90px',
              height: '90px',
              background: 'rgba(113, 50, 245, 0.86)',
              borderRadius: '30px',
              color: '#FFFFFF',
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

      const initialIsClusterMode = Boolean(map.getLevel() >= 5 && clustererRef.current);
      isClusterModeRef.current = initialIsClusterMode;
      setIsClusterMode(initialIsClusterMode);

      // 줌 시작 - 애니메이션 상태 시작
      addMapEventListener(map, 'zoom_start', () => {
        isAnimatingRef.current = true;
        isZoomingRef.current = true;
        suppressDragEndUntilRef.current = Date.now() + 700;
        notifyMapZoomState(true);
        setCustomMarkersVisibility('hidden');

        if (isClusterModeRef.current) {
          clustererRef.current?.clear();
          clusterMarkerRegistryRef.current.forEach((entry) => {
            entry.isAttached = false;
          });
        }
      });

      // 줌 변경 완료 - UI 레이아웃 변경은 최소화하고 마커 모드 전환이 필요할 때만 갱신
      addMapEventListener(map, 'zoom_changed', () => {
        const level = map.getLevel();
        onMapLevelChangeRef.current?.(level);

        isAnimatingRef.current = false;
        suppressDragEndUntilRef.current = Date.now() + 700;

        const nextIsClusterMode = Boolean(level >= 5 && clustererRef.current);
        const shouldSwitchMarkerMode = nextIsClusterMode !== isClusterModeRef.current;

        if (shouldSwitchMarkerMode) {
          isClusterModeRef.current = nextIsClusterMode;
          setIsClusterMode(nextIsClusterMode);
        }

        requestAnimationFrame(() => {
          updateVisiblePlatforms();

          if (nextIsClusterMode && !shouldSwitchMarkerMode && clustererRef.current) {
            const detachedEntries = [...clusterMarkerRegistryRef.current.values()].filter(
              (entry) => !entry.isAttached
            );
            if (detachedEntries.length > 0) {
              clustererRef.current.addMarkers(detachedEntries.map((entry) => entry.marker));
              detachedEntries.forEach((entry) => {
                entry.isAttached = true;
              });
            }
          }
        });

        revealCustomMarkersAfterZoom();
        settleZoomStateAfterDelay();
      });

      addMapEventListener(map, 'idle', () => {
        if (!isZoomingRef.current) {
          return;
        }

        if (zoomSettledTimerRef.current) {
          clearTimeout(zoomSettledTimerRef.current);
        }

        isAnimatingRef.current = false;
        isZoomingRef.current = false;
        onMapLevelChangeRef.current?.(map.getLevel());
        updateVisiblePlatforms();
        notifyViewportChange();
        notifyMapZoomState(false);
        revealCustomMarkersAfterZoom();
      });

      // 드래그 시작 - 애니메이션 상태 시작
      addMapEventListener(map, 'dragstart', () => {
        isAnimatingRef.current = true;
      });

      // 드래그 종료 - 애니메이션 완료 후 업데이트
      addMapEventListener(map, 'dragend', () => {
        isAnimatingRef.current = false;

        const isDragEndFromZoom =
          isZoomingRef.current || Date.now() < suppressDragEndUntilRef.current;

        // 줌으로 인한 dragend가 아닌 실제 드래그일 때만 onMapCenterChange 호출
        if (!isDragEndFromZoom && onMapCenterChangeRef.current) {
          const center = map.getCenter();
          const centerLocation: MapLocation = {
            latitude: center.getLat(),
            longitude: center.getLng(),
          };
          onMapCenterChangeRef.current(centerLocation);
        }
        if (!isDragEndFromZoom) {
          updateVisiblePlatforms();
          notifyViewportChange();
        }
      });

      // 초기화 후 크기 재조정
      initialViewportTimer = setTimeout(() => {
        if (isDisposed) return;

        if (map && map.relayout) {
          map.relayout();
        }
        updateVisiblePlatforms();
        notifyViewportChange();
      }, 100);
    };

    // 카카오맵 API가 이미 로드되어 있으면 바로 초기화
    if (window.kakao && window.kakao.maps) {
      initializeMap();
    } else {
      // 카카오맵 API 로드 대기
      kakaoMapsCheckInterval = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          if (kakaoMapsCheckInterval) {
            clearInterval(kakaoMapsCheckInterval);
            kakaoMapsCheckInterval = null;
          }
          initializeMap();
        }
      }, 100);
    }

    return () => {
      isDisposed = true;

      if (initializeRetryTimer) {
        clearTimeout(initializeRetryTimer);
      }
      if (initialViewportTimer) {
        clearTimeout(initialViewportTimer);
      }
      if (kakaoMapsCheckInterval) {
        clearInterval(kakaoMapsCheckInterval);
      }

      if (initializedMap && window.kakao?.maps?.event.removeListener) {
        mapEventListeners.forEach(({ type, handler }) => {
          window.kakao.maps.event.removeListener?.(initializedMap!, type, handler);
        });
      }

      if (mapRef.current === initializedMap) {
        mapRef.current = null;
      }
      clustererRef.current?.clear();
      clustererRef.current = null;
    };
  }, [
    notifyViewportChange,
    notifyMapZoomState,
    revealCustomMarkersAfterZoom,
    setCustomMarkersVisibility,
    settleZoomStateAfterDelay,
    updateVisiblePlatforms,
    userLocation,
  ]);

  // platforms 데이터가 변경되면 visiblePlatforms 업데이트 (지연 처리)
  useEffect(() => {
    let updateTimer: ReturnType<typeof setTimeout> | null = null;

    // 애니메이션 중이거나 줌 중이면 잠시 후 업데이트
    if (isAnimatingRef.current || isZoomingRef.current) {
      updateTimer = setTimeout(() => {
        updateVisiblePlatforms();
      }, 250); // 지도 이동 완료 대기
    } else {
      updateVisiblePlatforms();
    }

    return () => {
      if (updateTimer) {
        clearTimeout(updateTimer);
      }
    };
  }, [platforms, updateVisiblePlatforms]);

  // 로드뷰 모드 클릭 이벤트 관리
  useEffect(() => {
    if (!mapRef.current || !onMapClick) return;

    const map = mapRef.current;
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
        map,
        'click',
        clickListener as (...args: unknown[]) => void
      );
    }

    return () => {
      if (clickListener && window.kakao.maps.event.removeListener) {
        window.kakao.maps.event.removeListener(
          map,
          'click',
          clickListener as (...args: unknown[]) => void
        );
      }
    };
  }, [isRoadviewMode, onMapClick]);

  useEffect(() => {
    if (!mapRef.current) return;

    const startedAt = import.meta.env.DEV ? performance.now() : 0;
    let added = 0;
    let updated = 0;
    let removed = 0;
    const registry = serverClusterRegistryRef.current;

    if (!useServerClusters) {
      registry.forEach(({ overlay, element, clickHandler }) => {
        element.removeEventListener('click', clickHandler);
        overlay.setMap(null);
        removed += 1;
      });
      registry.clear();

      if (removed > 0) {
        logReconcileMetrics('server', {
          added,
          updated,
          removed,
          count: 0,
          durationMs: getReconcileDuration(startedAt),
        });
      }
      return;
    }

    const map = mapRef.current;
    customMarkerRegistryRef.current.forEach((entry) => {
      if (entry.isAttached) {
        entry.overlay.setMap(null);
        entry.isAttached = false;
      }
    });

    const attachedClusterEntries = [...clusterMarkerRegistryRef.current.values()].filter(
      (entry) => entry.isAttached
    );
    if (clustererRef.current && attachedClusterEntries.length > 0) {
      clustererRef.current.removeMarkers(
        attachedClusterEntries.map((entry) => entry.marker),
        true
      );
      clustererRef.current.redraw();
      attachedClusterEntries.forEach((entry) => {
        entry.isAttached = false;
      });
    }

    const desiredClusters = new Map(clusters.map((cluster) => [cluster.clusterId, cluster]));

    registry.forEach((entry, clusterId) => {
      if (desiredClusters.has(clusterId)) return;

      entry.element.removeEventListener('click', entry.clickHandler);
      entry.overlay.setMap(null);
      registry.delete(clusterId);
      removed += 1;
    });

    desiredClusters.forEach((cluster, clusterId) => {
      const positionKey = `${cluster.latitude}:${cluster.longitude}`;
      const contentKey = `${cluster.count}`;
      const existingEntry = registry.get(clusterId);

      if (existingEntry) {
        let didUpdate = false;
        existingEntry.cluster = cluster;

        if (existingEntry.positionKey !== positionKey) {
          existingEntry.overlay.setPosition(
            new window.kakao.maps.LatLng(cluster.latitude, cluster.longitude)
          );
          existingEntry.positionKey = positionKey;
          didUpdate = true;
        }
        if (existingEntry.contentKey !== contentKey) {
          updateServerClusterElement(existingEntry.element, cluster);
          existingEntry.contentKey = contentKey;
          didUpdate = true;
        }

        if (didUpdate) updated += 1;
        return;
      }

      const element = createServerClusterElement(cluster);
      const clickHandler = () => {
        const latestCluster = serverClusterRegistryRef.current.get(clusterId)?.cluster;
        const currentMap = mapRef.current;
        if (!latestCluster || !currentMap) return;

        const nextLevel = Math.max(1, currentMap.getLevel() - 1);
        currentMap.setLevel(nextLevel, {
          anchor: new window.kakao.maps.LatLng(latestCluster.latitude, latestCluster.longitude),
        });
      };
      element.addEventListener('click', clickHandler);

      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(cluster.latitude, cluster.longitude),
        content: element,
        yAnchor: 0.5,
        zIndex: 20,
      });
      overlay.setMap(map);
      registry.set(clusterId, {
        overlay,
        element,
        cluster,
        positionKey,
        contentKey,
        clickHandler,
      });
      added += 1;
    });

    logReconcileMetrics('server', {
      added,
      updated,
      removed,
      count: registry.size,
      durationMs: getReconcileDuration(startedAt),
    });
  }, [clusters, mapInitializationVersion, useServerClusters]);

  // 마커 업데이트 useEffect
  useEffect(() => {
    if (!mapRef.current || isAnimatingRef.current || useServerClusters) return;

    const startedAt = import.meta.env.DEV ? performance.now() : 0;
    const map = mapRef.current;
    const customRegistry = customMarkerRegistryRef.current;
    const clusterRegistry = clusterMarkerRegistryRef.current;
    let added = 0;
    let updated = 0;
    let removed = 0;

    // viewport 계산 전에는 전체 결과를 사용하고, 계산 후에는 빈 viewport도 그대로 반영한다.
    const platformsToRender = (visiblePlatforms ?? platforms).filter((platform) =>
      Boolean(
        platform.latitude &&
          platform.longitude &&
          platform.latitude !== 0 &&
          platform.longitude !== 0
      )
    );
    const desiredPlatforms = new Map(
      platformsToRender.map((platform) => [markerRegistryKey(platform), platform])
    );
    const selectedMarkerKey = (() => {
      if (!selectedPlatform) return null;

      const exactKey = markerRegistryKey(selectedPlatform);
      if (desiredPlatforms.has(exactKey)) return exactKey;

      return (
        [...desiredPlatforms.entries()].find(
          ([, platform]) =>
            platform.id === selectedPlatform.id && platform.partnerId === selectedPlatform.partnerId
        )?.[0] ?? null
      );
    })();

    if (isClusterMode) {
      customRegistry.forEach((entry, platformId) => {
        if (!desiredPlatforms.has(platformId)) {
          entry.element.removeEventListener('click', entry.clickHandler);
          entry.overlay.setMap(null);
          customRegistry.delete(platformId);
          return;
        }

        entry.platform = desiredPlatforms.get(platformId)!;
        if (entry.isAttached) {
          entry.overlay.setMap(null);
          entry.isAttached = false;
        }
      });

      const clusterer = clustererRef.current;
      if (!clusterer) return;

      const entriesToRemove = new Set<ClusterMarkerRegistryEntry>();
      const entriesToAdd = new Set<ClusterMarkerRegistryEntry>();
      const positionUpdates: Array<{
        entry: ClusterMarkerRegistryEntry;
        position: KakaoLatLng;
        positionKey: string;
      }> = [];

      clusterRegistry.forEach((entry, platformId) => {
        if (desiredPlatforms.has(platformId)) return;

        if (entry.isAttached) entriesToRemove.add(entry);
        clusterRegistry.delete(platformId);
        removed += 1;
      });

      desiredPlatforms.forEach((platform, platformId) => {
        const positionKey = `${platform.latitude}:${platform.longitude}`;
        const existingEntry = clusterRegistry.get(platformId);

        if (!existingEntry) {
          const entry: ClusterMarkerRegistryEntry = {
            marker: new window.kakao.maps.Marker({
              position: new window.kakao.maps.LatLng(platform.latitude, platform.longitude),
            }),
            positionKey,
            isAttached: false,
          };
          clusterRegistry.set(platformId, entry);
          entriesToAdd.add(entry);
          added += 1;
          return;
        }

        if (existingEntry.positionKey !== positionKey) {
          if (existingEntry.isAttached) entriesToRemove.add(existingEntry);
          positionUpdates.push({
            entry: existingEntry,
            position: new window.kakao.maps.LatLng(platform.latitude, platform.longitude),
            positionKey,
          });
          entriesToAdd.add(existingEntry);
          updated += 1;
        } else if (!existingEntry.isAttached) {
          entriesToAdd.add(existingEntry);
          updated += 1;
        }
      });

      if (entriesToRemove.size > 0) {
        clusterer.removeMarkers(
          [...entriesToRemove].map((entry) => entry.marker),
          true
        );
        entriesToRemove.forEach((entry) => {
          entry.isAttached = false;
        });
      }
      positionUpdates.forEach(({ entry, position, positionKey }) => {
        entry.marker.setPosition(position);
        entry.positionKey = positionKey;
      });
      if (entriesToAdd.size > 0) {
        clusterer.addMarkers(
          [...entriesToAdd].map((entry) => entry.marker),
          true
        );
        entriesToAdd.forEach((entry) => {
          entry.isAttached = true;
        });
      }
      if (entriesToRemove.size > 0 || entriesToAdd.size > 0) {
        clusterer.redraw();
      }

      logReconcileMetrics('cluster', {
        added,
        updated,
        removed,
        count: clusterRegistry.size,
        durationMs: getReconcileDuration(startedAt),
      });
    } else {
      const attachedClusterEntries = [...clusterRegistry.values()].filter(
        (entry) => entry.isAttached
      );
      if (clustererRef.current && attachedClusterEntries.length > 0) {
        clustererRef.current.removeMarkers(
          attachedClusterEntries.map((entry) => entry.marker),
          true
        );
        clustererRef.current.redraw();
        attachedClusterEntries.forEach((entry) => {
          entry.isAttached = false;
        });
      }
      clusterRegistry.forEach((_entry, platformId) => {
        if (!desiredPlatforms.has(platformId)) {
          clusterRegistry.delete(platformId);
        }
      });

      customRegistry.forEach((entry, platformId) => {
        if (desiredPlatforms.has(platformId)) return;

        entry.element.removeEventListener('click', entry.clickHandler);
        entry.overlay.setMap(null);
        customRegistry.delete(platformId);
        removed += 1;
      });

      desiredPlatforms.forEach((platform, platformId) => {
        const displayPosition = displayPositionByMarkerKey.get(platformId) ?? platform;
        const positionKey = `${displayPosition.latitude}:${displayPosition.longitude}`;
        const isSelected = selectedMarkerKey === platformId;
        const contentKey = JSON.stringify([platform.imageUrl ?? '', platform.name, isSelected]);
        const existingEntry = customRegistry.get(platformId);

        if (existingEntry) {
          let didUpdate = false;
          existingEntry.platform = platform;

          if (existingEntry.positionKey !== positionKey) {
            existingEntry.overlay.setPosition(
              new window.kakao.maps.LatLng(displayPosition.latitude, displayPosition.longitude)
            );
            existingEntry.positionKey = positionKey;
            didUpdate = true;
          }

          if (existingEntry.contentKey !== contentKey) {
            existingEntry.element.innerHTML = renderToString(
              <CustomMarker
                imageUrl={platform.imageUrl}
                name={platform.name}
                isSelected={isSelected}
              />
            );
            installCustomMarkerImageFallback(existingEntry.element);
            const markerElement =
              existingEntry.element.querySelector<HTMLElement>(
                '[data-itplace-map-marker="true"]'
              ) ?? existingEntry.element;
            markerElement.style.visibility = areMarkersHiddenRef.current ? 'hidden' : 'visible';
            markerElement.style.pointerEvents = areMarkersHiddenRef.current ? 'none' : '';
            existingEntry.overlay.setZIndex(isSelected ? 1000 : 1);
            existingEntry.contentKey = contentKey;
            didUpdate = true;
          }

          if (!existingEntry.isAttached) {
            existingEntry.overlay.setMap(map);
            existingEntry.isAttached = true;
            didUpdate = true;
          }

          if (didUpdate) updated += 1;
          return;
        }

        const markerElement = document.createElement('div');
        markerElement.innerHTML = renderToString(
          <CustomMarker imageUrl={platform.imageUrl} name={platform.name} isSelected={isSelected} />
        );
        installCustomMarkerImageFallback(markerElement);
        const markerVisualElement =
          markerElement.querySelector<HTMLElement>('[data-itplace-map-marker="true"]') ??
          markerElement;
        markerVisualElement.style.visibility = areMarkersHiddenRef.current ? 'hidden' : 'visible';
        markerVisualElement.style.pointerEvents = areMarkersHiddenRef.current ? 'none' : '';

        const clickHandler = () => {
          const latestPlatform = customMarkerRegistryRef.current.get(platformId)?.platform;
          if (latestPlatform) onPlatformSelectRef.current(latestPlatform);
        };
        markerElement.addEventListener('click', clickHandler);

        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(
            displayPosition.latitude,
            displayPosition.longitude
          ),
          content: markerElement,
          yAnchor: 1,
          zIndex: isSelected ? 1000 : 1,
        });
        overlay.setMap(map);
        customRegistry.set(platformId, {
          overlay,
          element: markerElement,
          platform,
          positionKey,
          contentKey,
          clickHandler,
          isAttached: true,
        });
        added += 1;
      });

      logReconcileMetrics('custom', {
        added,
        updated,
        removed,
        count: customRegistry.size,
        durationMs: getReconcileDuration(startedAt),
      });
    }
  }, [
    visiblePlatforms,
    platforms,
    selectedPlatform,
    isClusterMode,
    displayPositionByMarkerKey,
    mapInitializationVersion,
    useServerClusters,
  ]);

  // 선택된 플랫폼으로 지도 중심 이동
  useEffect(() => {
    if (!mapRef.current || !selectedPlatform) return;

    const moveLatLon = new window.kakao.maps.LatLng(
      selectedPlatform.latitude,
      selectedPlatform.longitude
    );
    mapRef.current.setCenter(moveLatLon);

    const visiblePlatformsFrame = requestAnimationFrame(updateVisiblePlatforms);
    return () => cancelAnimationFrame(visiblePlatformsFrame);
  }, [mapInitializationVersion, selectedPlatform, updateVisiblePlatforms]);

  // centerLocation prop이 변경되면 지도 중심 이동
  useEffect(() => {
    if (!mapRef.current || !centerLocation) {
      return;
    }

    const currentCenter = mapRef.current.getCenter();
    const isAlreadyCentered =
      Math.abs(currentCenter.getLat() - centerLocation.latitude) < 0.000001 &&
      Math.abs(currentCenter.getLng() - centerLocation.longitude) < 0.000001;

    if (isAlreadyCentered) {
      updateVisiblePlatforms();
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
  }, [centerLocation, mapInitializationVersion, updateVisiblePlatforms]);

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
