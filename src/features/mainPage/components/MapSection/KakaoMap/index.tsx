import React, { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react';
import { renderToString } from 'react-dom/server';
import { MapBounds, Platform, MapLocation, MapCluster } from '../../../types';
import {
  KakaoMap as KakaoMapType,
  KakaoCustomOverlay,
  KakaoMouseEvent,
} from '../../../types/kakao';
import CustomMarker from './CustomMarker';
import { installCustomMarkerImageFallback } from './customMarkerFallback';
import { CUSTOM_MARKER_METRICS, type CustomMarkerMode } from './markerMetrics';

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
  offsetX: number;
  offsetY: number;
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

const DUPLICATE_MARKER_RING_SIZE = 8;
const DEFAULT_MAP_LEVEL = 4;
const CLUSTER_TAIL_HEIGHT = 9;
const SERVER_CLUSTER_STYLE_VERSION = 'administrative-pin-v14';
const CLUSTER_DENSITY_COLORS = {
  low: '#7986CB',
  medium: '#5C6BC0',
  high: '#3949AB',
  extreme: '#283593',
} as const;
const administrativeClusterBackgroundCache = new Map<string, string>();

const createClusterPinBackground = (size: number, color: string, filled = true) => {
  const height = size + CLUSTER_TAIL_HEIGHT;
  const center = size / 2;
  const shoulderY = Math.round(size * 0.42);
  const lowerCurveY = size - 7;
  const tailStartY = size - 4;
  const tailHalfWidth = Math.max(5, Math.round(size * 0.15));
  const fillColor = filled ? color : '#FFFFFF';
  const strokeColor = filled ? '#FFFFFF' : color;
  const highlightColor = filled ? '#FFFFFF' : color;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${height}" viewBox="0 0 ${size} ${height}">
      <path d="M${center} 2 C${size * 0.76} 2 ${size - 2} ${size * 0.2} ${
        size - 2
      } ${shoulderY} C${size - 2} ${size * 0.68} ${size * 0.78} ${lowerCurveY} ${
        center + tailHalfWidth
      } ${tailStartY} L${center} ${height - 1} L${center - tailHalfWidth} ${
        tailStartY
      } C${size * 0.22} ${lowerCurveY} 2 ${size * 0.68} 2 ${shoulderY} C2 ${
        size * 0.2
      } ${size * 0.24} 2 ${center} 2 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M${size * 0.31} 8 Q${center} 5 ${
        size * 0.69
      } 8" stroke="${highlightColor}" stroke-opacity="${
        filled ? 0.26 : 0.18
      }" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `;
  const dataUri = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  return `url("${dataUri}") center top / ${size}px ${height}px no-repeat`;
};

const createAdministrativeClusterBackground = (width: number, color: string) => {
  const cacheKey = `${width}:${color}`;
  const cachedBackground = administrativeClusterBackgroundCache.get(cacheKey);
  if (cachedBackground) return cachedBackground;

  const bodyHeight = 40;
  const height = 49;
  const center = width / 2;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <path d="M14 1 H${width - 14} Q${width - 1} 1 ${width - 1} 14 V${
        bodyHeight - 13
      } Q${width - 1} ${bodyHeight - 1} ${width - 14} ${bodyHeight - 1} H${
        center + 8
      } L${center} ${height - 1} L${center - 8} ${bodyHeight - 1} H14 Q1 ${
        bodyHeight - 1
      } 1 ${bodyHeight - 13} V14 Q1 1 14 1 Z" fill="#FEFDFF" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M14 5 H${width - 14}" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.9"/>
    </svg>
  `;
  const dataUri = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  const background = `url("${dataUri}") center top / ${width}px ${height}px no-repeat`;
  administrativeClusterBackgroundCache.set(cacheKey, background);
  return background;
};

const coordinateKey = (platform: Platform): string =>
  `${Number(platform.latitude).toFixed(12)}:${Number(platform.longitude).toFixed(12)}`;

const markerRegistryKey = (platform: Platform): string =>
  `${platform.id}:${platform.partnerId}:${platform.carrier ?? 'ALL'}`;

const getCategoryPinColor = (category?: string) => {
  const normalizedCategory = (category ?? '').toLowerCase();
  if (normalizedCategory.includes('카페') || normalizedCategory.includes('커피')) return '#7C3AED';
  if (normalizedCategory.includes('편의')) return '#2563EB';
  if (normalizedCategory.includes('푸드') || normalizedCategory.includes('음식')) return '#C67A32';
  if (normalizedCategory.includes('영화') || normalizedCategory.includes('문화')) return '#DB2777';
  return '#7132F5';
};

const getClusterDensityColor = (count: number) => {
  if (count < 10) return CLUSTER_DENSITY_COLORS.low;
  if (count < 100) return CLUSTER_DENSITY_COLORS.medium;
  if (count < 1000) return CLUSTER_DENSITY_COLORS.high;
  return CLUSTER_DENSITY_COLORS.extreme;
};

const getClusterDensityShadows = (count: number) => {
  if (count < 10) {
    return { resting: 'rgba(62,72,130,0.23)', active: 'rgba(62,72,130,0.32)' };
  }
  if (count < 100) {
    return { resting: 'rgba(43,53,113,0.25)', active: 'rgba(43,53,113,0.34)' };
  }
  if (count < 1000) {
    return { resting: 'rgba(27,36,93,0.28)', active: 'rgba(27,36,93,0.37)' };
  }
  return { resting: 'rgba(18,25,74,0.3)', active: 'rgba(18,25,74,0.39)' };
};

const getAdministrativeClusterColor = (unitType?: MapCluster['administrativeUnitType']) => {
  if (unitType === 'CITY') return '#493D9B';
  if (unitType === 'TOWN') return '#6253C5';
  if (unitType === 'LEGAL_DONG') return '#7865D8';
  return '#5C6BC0';
};

const updateAdministrativeClusterElement = (
  element: HTMLButtonElement,
  cluster: MapCluster,
  administrativeUnitName: string
) => {
  const accentColor = getAdministrativeClusterColor(cluster.administrativeUnitType);
  const countLabel = String(cluster.count);
  const labelLength = Array.from(administrativeUnitName).length;
  const visualWidth = Math.min(156, Math.max(86, labelLength * 13 + countLabel.length * 7 + 42));
  const shadows = {
    resting: 'rgba(56, 46, 118, 0.2)',
    active: 'rgba(56, 46, 118, 0.3)',
  };
  const ariaLabel = `${administrativeUnitName} 혜택 ${countLabel}곳`;

  element.setAttribute('aria-label', ariaLabel);
  element.setAttribute('title', ariaLabel);
  element.setAttribute('data-itplace-cluster-marker', 'true');
  element.setAttribute('data-cluster-size', String(visualWidth));
  element.dataset.clusterShadow = shadows.resting;
  element.dataset.clusterShadowActive = shadows.active;
  element.style.cssText = [
    'position:relative',
    `width:${visualWidth}px`,
    'height:49px',
    'padding:0',
    'border:0',
    `background:${createAdministrativeClusterBackground(visualWidth, accentColor)}`,
    'display:block',
    'cursor:pointer',
    'overflow:visible',
    'font-family:inherit',
    'transform-origin:center bottom',
    'transition:transform 160ms ease,filter 160ms ease',
    `filter:drop-shadow(0 5px 8px ${shadows.resting})`,
  ].join(';');

  const existingContent = element.querySelector<HTMLSpanElement>(
    '[data-administrative-cluster-content="true"]'
  );
  if (existingContent) {
    const existingName = existingContent.querySelector<HTMLSpanElement>(
      '[data-administrative-cluster-name="true"]'
    );
    const existingCount = existingContent.querySelector<HTMLSpanElement>(
      '[data-administrative-cluster-count="true"]'
    );
    if (existingName && existingCount) {
      existingName.textContent = administrativeUnitName;
      existingCount.textContent = countLabel;
      existingCount.style.background = accentColor;
      return;
    }
  }

  const content = document.createElement('span');
  content.dataset.administrativeClusterContent = 'true';
  content.style.cssText = [
    'position:absolute',
    'inset:0 0 auto 0',
    'height:40px',
    'padding:0 9px',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'gap:6px',
    'box-sizing:border-box',
  ].join(';');

  const name = document.createElement('span');
  name.dataset.administrativeClusterName = 'true';
  name.textContent = administrativeUnitName;
  name.style.cssText = [
    'min-width:0',
    'overflow:hidden',
    'text-overflow:ellipsis',
    'white-space:nowrap',
    'color:#352E5D',
    'font-size:13px',
    'font-weight:800',
    'line-height:1',
    'letter-spacing:-0.02em',
  ].join(';');

  const count = document.createElement('span');
  count.dataset.administrativeClusterCount = 'true';
  count.textContent = countLabel;
  count.style.cssText = [
    'flex:0 0 auto',
    'min-width:22px',
    'height:22px',
    'padding:0 6px',
    'border-radius:999px',
    `background:${accentColor}`,
    'display:inline-flex',
    'align-items:center',
    'justify-content:center',
    'box-sizing:border-box',
    'color:#FFFFFF',
    'font-size:11px',
    'font-weight:900',
    'line-height:1',
  ].join(';');

  content.replaceChildren(name, count);
  element.replaceChildren(content);
};

const updateServerClusterElement = (element: HTMLButtonElement, cluster: MapCluster) => {
  const administrativeUnitName = cluster.administrativeUnitName?.trim();
  if (administrativeUnitName) {
    updateAdministrativeClusterElement(element, cluster, administrativeUnitName);
    return;
  }

  const isSingleLocation = cluster.count <= 1;
  const categoryLabel = cluster.category && cluster.category !== '전체' ? cluster.category : '혜택';
  const accentColor = isSingleLocation
    ? getCategoryPinColor(cluster.category)
    : getClusterDensityColor(cluster.count);
  const badgeSize =
    cluster.count < 10 ? 38 : cluster.count < 100 ? 44 : cluster.count < 1000 ? 50 : 56;
  const visualSize = isSingleLocation ? 38 : badgeSize;
  const height = visualSize + CLUSTER_TAIL_HEIGHT;
  const shadows = isSingleLocation
    ? { resting: 'rgba(45,55,72,0.22)', active: 'rgba(45,55,72,0.31)' }
    : getClusterDensityShadows(cluster.count);
  const ariaLabel = isSingleLocation
    ? `${categoryLabel} 혜택 위치`
    : `${categoryLabel} 혜택 ${cluster.count}곳`;

  element.setAttribute('aria-label', ariaLabel);
  element.setAttribute('title', ariaLabel);
  element.setAttribute('data-itplace-cluster-marker', 'true');
  element.setAttribute('data-cluster-size', String(visualSize));
  element.dataset.clusterShadow = shadows.resting;
  element.dataset.clusterShadowActive = shadows.active;
  element.style.cssText = [
    'position:relative',
    `width:${visualSize}px`,
    `height:${height}px`,
    'padding:0',
    'border:0',
    `background:${createClusterPinBackground(visualSize, accentColor, !isSingleLocation)}`,
    'display:block',
    'cursor:pointer',
    'line-height:1',
    'overflow:visible',
    'font-family:inherit',
    'transform-origin:center bottom',
    'transition:transform 160ms ease,filter 160ms ease',
    `filter:drop-shadow(0 5px 8px ${shadows.resting})`,
  ].join(';');

  const badge = document.createElement('span');
  badge.style.cssText = [
    'position:relative',
    'z-index:2',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'gap:1px',
    `width:${visualSize}px`,
    `height:${visualSize - 4}px`,
    'margin:0 auto',
    'box-sizing:border-box',
    'border:0',
    'background:transparent',
    `color:${isSingleLocation ? accentColor : '#FFFFFF'}`,
    `font-size:${isSingleLocation ? 10 : cluster.count < 10 ? 15 : cluster.count < 100 ? 16 : 17}px`,
    'font-weight:900',
    'line-height:1',
    'text-align:center',
    'white-space:nowrap',
  ].join(';');
  if (isSingleLocation) {
    badge.textContent = categoryLabel.slice(0, 2);
  } else {
    badge.textContent = String(cluster.count);
  }

  element.replaceChildren(badge);
};

const createServerClusterElement = (cluster: MapCluster) => {
  const element = document.createElement('button');
  element.type = 'button';
  updateServerClusterElement(element, cluster);
  const setEmphasis = (active: boolean) => {
    element.style.transform = active ? 'translateY(-2px) scale(1.04)' : '';
    element.style.filter = active
      ? `drop-shadow(0 8px 12px ${element.dataset.clusterShadowActive})`
      : `drop-shadow(0 5px 8px ${element.dataset.clusterShadow})`;
  };
  element.addEventListener('mouseenter', () => setEmphasis(true));
  element.addEventListener('mouseleave', () => setEmphasis(false));
  element.addEventListener('focus', () => setEmphasis(true));
  element.addEventListener('blur', () => setEmphasis(false));
  return element;
};

const logReconcileMetrics = (mode: 'custom' | 'server', metrics: ReconcileMetrics) => {
  if (!import.meta.env.DEV) return;

  console.debug(`[KakaoMap] ${mode} marker reconcile`, metrics);
};

const getReconcileDuration = (startedAt: number) =>
  import.meta.env.DEV ? performance.now() - startedAt : 0;

const toDisplayPositionMap = (
  platforms: Platform[],
  markerMode: CustomMarkerMode
): Map<string, MarkerDisplayPosition> => {
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
        offsetX: 0,
        offsetY: 0,
      });
      return;
    }

    const orderedGroup = [...group].sort((first, second) => {
      const storeOrder = first.storeId - second.storeId;
      return storeOrder !== 0
        ? storeOrder
        : markerRegistryKey(first).localeCompare(markerRegistryKey(second));
    });
    const markerWidth = CUSTOM_MARKER_METRICS[markerMode].width;
    const targetCenterSpacing = markerWidth * 0.6;
    const maximumFirstRingRadius =
      targetCenterSpacing / (2 * Math.sin(Math.PI / DUPLICATE_MARKER_RING_SIZE));
    const ringSpacing = markerWidth * 0.75;

    orderedGroup.forEach((platform, index) => {
      if (index === 0) {
        displayPositions.set(markerRegistryKey(platform), {
          latitude: platform.latitude,
          longitude: platform.longitude,
          offsetX: 0,
          offsetY: 0,
        });
        return;
      }

      const remainingIndex = index - 1;
      const remainingCount = orderedGroup.length - 1;
      const ring = Math.floor(remainingIndex / DUPLICATE_MARKER_RING_SIZE);
      const indexInRing = remainingIndex % DUPLICATE_MARKER_RING_SIZE;
      const countInRing = Math.min(
        DUPLICATE_MARKER_RING_SIZE,
        remainingCount - ring * DUPLICATE_MARKER_RING_SIZE
      );
      const angle = (2 * Math.PI * indexInRing) / countInRing - Math.PI / 2;
      const outerNeighborRadius =
        countInRing > 1 ? targetCenterSpacing / (2 * Math.sin(Math.PI / countInRing)) : 0;
      const firstRingRadius = Math.max(targetCenterSpacing, outerNeighborRadius);
      const radiusPixels =
        ring === 0 ? firstRingRadius : maximumFirstRingRadius + ring * ringSpacing;
      const offsetX = Math.round(Math.cos(angle) * radiusPixels * 100) / 100;
      const offsetY = Math.round(Math.sin(angle) * radiusPixels * 100) / 100;

      displayPositions.set(markerRegistryKey(platform), {
        latitude: platform.latitude,
        longitude: platform.longitude,
        offsetX,
        offsetY,
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
  const serverClusterRegistryRef = useRef(new Map<string, ServerClusterRegistryEntry>());
  const isAnimatingRef = useRef<boolean>(false);
  const isZoomingRef = useRef<boolean>(false);
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
  const useServerClustersRef = useRef(useServerClusters);
  platformsRef.current = platforms;
  onPlatformSelectRef.current = onPlatformSelect;
  onLocationChangeRef.current = onLocationChange;
  onMapCenterChangeRef.current = onMapCenterChange;
  onMapLevelChangeRef.current = onMapLevelChange;
  onViewportChangeRef.current = onViewportChange;
  initialCenterLocationRef.current = initialCenterLocation;
  initialMapLevelRef.current = initialMapLevel;
  useServerClustersRef.current = useServerClusters;
  const [userLocation, setUserLocation] = useState<MapLocation | null>(null);
  const [mapInitializationVersion, setMapInitializationVersion] = useState(0);
  const [currentMapLevel, setCurrentMapLevel] = useState(initialMapLevel ?? DEFAULT_MAP_LEVEL);
  const [visiblePlatforms, setVisiblePlatforms] = useState<Platform[] | null>(null);
  const markerMode: CustomMarkerMode = currentMapLevel >= 4 ? 'compact' : 'full';
  const displayPositionByMarkerKey = useMemo(
    () => toDisplayPositionMap(platforms, markerMode),
    [markerMode, platforms]
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
      if (useServerClustersRef.current) return;
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
        level: initialMapLevelRef.current ?? DEFAULT_MAP_LEVEL,
      };

      const map = new window.kakao.maps.Map(mapContainer.current!, options);
      initializedMap = map;
      mapRef.current = map;
      setCurrentMapLevel(map.getLevel());
      setMapInitializationVersion((version) => version + 1);

      // 줌 시작 - 애니메이션 상태 시작
      addMapEventListener(map, 'zoom_start', () => {
        isAnimatingRef.current = true;
        isZoomingRef.current = true;
        suppressDragEndUntilRef.current = Date.now() + 700;
        notifyMapZoomState(true);
        setCustomMarkersVisibility('hidden');
      });

      // 줌 변경 완료 - 상세 마커 크기와 viewport 결과를 갱신한다.
      addMapEventListener(map, 'zoom_changed', () => {
        const level = map.getLevel();
        setCurrentMapLevel(level);
        onMapLevelChangeRef.current?.(level);

        isAnimatingRef.current = false;
        suppressDragEndUntilRef.current = Date.now() + 700;

        requestAnimationFrame(updateVisiblePlatforms);
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
        const level = map.getLevel();
        setCurrentMapLevel(level);
        onMapLevelChangeRef.current?.(level);
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

  useLayoutEffect(() => {
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

      // 5→4 전환에서 서버 클러스터가 해제된 뒤 새 상세 마커가 hidden 상태를
      // 상속하지 않도록 visibility 기준을 먼저 복구한다.
      setCustomMarkersVisibility('visible');

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
      const contentKey = JSON.stringify([
        SERVER_CLUSTER_STYLE_VERSION,
        cluster.category,
        cluster.count,
        cluster.administrativeUnitType,
        cluster.administrativeUnitName,
        cluster.targetMapLevel,
      ]);
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

        const currentLevel = currentMap.getLevel();
        const requestedTargetLevel = latestCluster.targetMapLevel;
        const nextLevel =
          typeof requestedTargetLevel === 'number' && requestedTargetLevel < currentLevel
            ? Math.max(1, requestedTargetLevel)
            : Math.max(1, currentLevel - 1);
        currentMap.setLevel(nextLevel, {
          anchor: new window.kakao.maps.LatLng(latestCluster.latitude, latestCluster.longitude),
        });
      };
      element.addEventListener('click', clickHandler);

      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(cluster.latitude, cluster.longitude),
        content: element,
        clickable: true,
        xAnchor: 0.5,
        yAnchor: 1,
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
  }, [clusters, mapInitializationVersion, setCustomMarkersVisibility, useServerClusters]);

  // 마커 업데이트 useEffect
  useEffect(() => {
    if (!mapRef.current || isAnimatingRef.current) return;

    const startedAt = import.meta.env.DEV ? performance.now() : 0;
    const map = mapRef.current;
    const customRegistry = customMarkerRegistryRef.current;
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

    if (!useServerClusters) {
      customRegistry.forEach((entry, platformId) => {
        if (desiredPlatforms.has(platformId)) return;

        entry.element.removeEventListener('click', entry.clickHandler);
        entry.overlay.setMap(null);
        customRegistry.delete(platformId);
        removed += 1;
      });

      desiredPlatforms.forEach((platform, platformId) => {
        const displayPosition = displayPositionByMarkerKey.get(platformId) ?? {
          latitude: platform.latitude,
          longitude: platform.longitude,
          offsetX: 0,
          offsetY: 0,
        };
        const positionKey = `${displayPosition.latitude}:${displayPosition.longitude}`;
        const isSelected = selectedMarkerKey === platformId;
        const contentKey = JSON.stringify([
          markerMode,
          displayPosition.offsetX,
          displayPosition.offsetY,
          platform.imageUrl ?? '',
          platform.name,
          isSelected,
        ]);
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
                mode={markerMode}
                offsetX={displayPosition.offsetX}
                offsetY={displayPosition.offsetY}
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
          <CustomMarker
            imageUrl={platform.imageUrl}
            name={platform.name}
            isSelected={isSelected}
            mode={markerMode}
            offsetX={displayPosition.offsetX}
            offsetY={displayPosition.offsetY}
          />
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
          clickable: true,
          xAnchor: 0.5,
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
    markerMode,
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
