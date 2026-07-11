import { useState, useEffect, useCallback, useRef } from 'react';
import { MapBounds, MapCluster, Platform } from '../types';
import {
  getStorePreviewList,
  getStorePreviewListByCategory,
  getStoreClustersInView,
  getStorePreviewsInView,
  getCurrentLocation,
  getAddressFromCoordinates,
  searchStorePreviews,
} from '../api/storeApi';
import { transformMapStorePreviewsToPlatforms } from '../utils/dataTransform';
import { getRadiusByMapLevel } from '../utils/mapUtils';
import { useApiCall } from './useApiCall';
import { DEFAULT_RADIUS } from '../constants';

type InViewPreviewOptions = {
  limit: number;
  includeBenefits: boolean;
  boundsPaddingRatio: number;
};

const SERVER_CLUSTER_MIN_LEVEL = 5;

const shouldUseServerClusters = (mapLevel?: number) =>
  Boolean(mapLevel && mapLevel >= SERVER_CLUSTER_MIN_LEVEL);

const getInViewPreviewOptionsByMapLevel = (mapLevel?: number): InViewPreviewOptions => {
  if (!mapLevel) return { limit: 500, includeBenefits: true, boundsPaddingRatio: 0 };
  if (mapLevel >= 8) return { limit: 2000, includeBenefits: false, boundsPaddingRatio: 0.5 };
  if (mapLevel >= 7) return { limit: 1600, includeBenefits: false, boundsPaddingRatio: 0.35 };
  if (mapLevel >= 6) return { limit: 1200, includeBenefits: false, boundsPaddingRatio: 0.2 };
  if (mapLevel >= 5) return { limit: 900, includeBenefits: false, boundsPaddingRatio: 0.1 };
  return { limit: 500, includeBenefits: true, boundsPaddingRatio: 0 };
};

const expandMapBounds = (bounds: MapBounds, paddingRatio: number): MapBounds => {
  if (paddingRatio <= 0) return bounds;

  const latPadding = (bounds.maxLat - bounds.minLat) * paddingRatio;
  const lngPadding = (bounds.maxLng - bounds.minLng) * paddingRatio;

  return {
    minLat: Math.max(-90, bounds.minLat - latPadding),
    minLng: Math.max(-180, bounds.minLng - lngPadding),
    maxLat: Math.min(90, bounds.maxLat + latPadding),
    maxLng: Math.min(180, bounds.maxLng + lngPadding),
  };
};

/**
 * 가맹점 데이터 관리 훅
 * 위치 기반 가맹점 검색, 카테고리 필터링, 지도 연동 기능 제공
 */
export const useStoreData = (mapCenter?: { lat: number; lng: number } | null) => {
  // API 상태 관리
  const { data: platforms, isLoading, error, execute } = useApiCall<Platform[]>([]);
  const [mapClusters, setMapClusters] = useState<MapCluster[]>([]);
  const [isMapClusterSnapshotReady, setIsMapClusterSnapshotReady] = useState(false);
  const viewportRequestSeqRef = useRef(0);
  const viewportRequestControllerRef = useRef<AbortController | null>(null);
  const addressRequestSeqRef = useRef(0);
  const addressRequestControllerRef = useRef<AbortController | null>(null);
  const platformsRef = useRef<Platform[]>([]);
  platformsRef.current = platforms || [];

  // 위치 관련 상태
  const [currentLocation, setCurrentLocation] = useState<string>('위치 정보 로딩 중...');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // userCoords의 최신 값을 참조하기 위한 ref
  const userCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // mapCenter의 최신 값을 참조하기 위한 ref
  const mapCenterRef = useRef<{ lat: number; lng: number } | null>(mapCenter);
  mapCenterRef.current = mapCenter;

  // 지도 viewport bounds의 최신 값을 참조하기 위한 ref
  const currentMapBoundsRef = useRef<MapBounds | null>(null);

  // 카테고리 필터 상태
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentMapLevelInHook, setCurrentMapLevelInHook] = useState<number>(4); // 지도 레벨 상태 추가

  const commitMapClusterSnapshot = useCallback((clusters: MapCluster[]) => {
    setMapClusters(clusters);
    setIsMapClusterSnapshotReady(true);
  }, []);

  const clearMapClusterSnapshot = useCallback(() => {
    setMapClusters([]);
    setIsMapClusterSnapshotReady(false);
  }, []);

  const beginViewportRequest = useCallback(() => {
    viewportRequestControllerRef.current?.abort();

    const controller = new AbortController();
    const requestSeq = viewportRequestSeqRef.current + 1;
    viewportRequestControllerRef.current = controller;
    viewportRequestSeqRef.current = requestSeq;

    return { controller, requestSeq };
  }, []);

  const cancelViewportRequest = useCallback(() => {
    viewportRequestControllerRef.current?.abort();
    viewportRequestControllerRef.current = null;
    viewportRequestSeqRef.current += 1;
  }, []);

  const isLatestViewportRequest = useCallback(
    (requestSeq: number, signal: AbortSignal) =>
      !signal.aborted && viewportRequestSeqRef.current === requestSeq,
    []
  );

  const updateAddressLatest = useCallback(async (lat: number, lng: number) => {
    addressRequestControllerRef.current?.abort();

    const controller = new AbortController();
    const requestSeq = addressRequestSeqRef.current + 1;
    addressRequestControllerRef.current = controller;
    addressRequestSeqRef.current = requestSeq;

    try {
      const address = await getAddressFromCoordinates(lat, lng, controller.signal);
      if (!controller.signal.aborted && addressRequestSeqRef.current === requestSeq) {
        setCurrentLocation(address);
      }
    } catch {
      // 취소되거나 주소 변환에 실패해도 지도/마커 조회에는 영향을 주지 않는다.
    } finally {
      if (addressRequestSeqRef.current === requestSeq) {
        addressRequestControllerRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      viewportRequestControllerRef.current?.abort();
      addressRequestControllerRef.current?.abort();
    };
  }, []);

  /**
   * 카테고리별 가맹점 데이터 로드
   * 카테고리가 '전체'이거나 null인 경우 전체 검색, 그 외에는 카테고리별 검색
   */
  const loadStoresByCategory = useCallback(
    async (
      lat: number,
      lng: number,
      radius: number,
      category: string | null,
      userLat?: number,
      userLng?: number,
      signal?: AbortSignal
    ) => {
      const shouldFilterByCategory = category && category !== '전체';

      // 사용자 위치: 파라미터로 전달되면 사용, 없으면 현재 저장된 사용자 위치 사용
      const currentUserCoords = userCoordsRef.current;
      const finalUserLat = userLat !== undefined ? userLat : currentUserCoords?.lat;
      const finalUserLng = userLng !== undefined ? userLng : currentUserCoords?.lng;

      const storeResponse = shouldFilterByCategory
        ? await getStorePreviewListByCategory(
            {
              lat,
              lng,
              radiusMeters: radius,
              category,
              userLat: finalUserLat,
              userLng: finalUserLng,
            },
            signal
          )
        : await getStorePreviewList(
            {
              lat,
              lng,
              radiusMeters: radius,
              userLat: finalUserLat,
              userLng: finalUserLng,
            },
            signal
          );

      return transformMapStorePreviewsToPlatforms(storeResponse.data);
    },
    []
  );

  const loadStoresInBounds = useCallback(
    async (
      bounds: MapBounds,
      category: string | null,
      userLat?: number,
      userLng?: number,
      limit = 500,
      includeBenefits = true,
      boundsPaddingRatio = 0,
      signal?: AbortSignal
    ) => {
      const currentUserCoords = userCoordsRef.current;
      const queryBounds = expandMapBounds(bounds, boundsPaddingRatio);
      const boundsCenterLat = (queryBounds.minLat + queryBounds.maxLat) / 2;
      const boundsCenterLng = (queryBounds.minLng + queryBounds.maxLng) / 2;
      const finalUserLat =
        userLat !== undefined ? userLat : (currentUserCoords?.lat ?? boundsCenterLat);
      const finalUserLng =
        userLng !== undefined ? userLng : (currentUserCoords?.lng ?? boundsCenterLng);
      const shouldFilterByCategory = category && category !== '전체';

      try {
        const storeResponse = await getStorePreviewsInView(
          {
            minLat: queryBounds.minLat,
            minLng: queryBounds.minLng,
            maxLat: queryBounds.maxLat,
            maxLng: queryBounds.maxLng,
            category: shouldFilterByCategory ? category : undefined,
            userLat: finalUserLat,
            userLng: finalUserLng,
            limit,
            includeBenefits,
          },
          signal
        );

        return transformMapStorePreviewsToPlatforms(storeResponse.data);
      } catch (error) {
        if (signal?.aborted) {
          throw error;
        }

        const latMeters = Math.abs(queryBounds.maxLat - queryBounds.minLat) * 111_320;
        const lngMeters =
          Math.abs(queryBounds.maxLng - queryBounds.minLng) *
          111_320 *
          Math.cos((boundsCenterLat * Math.PI) / 180);
        const fallbackRadius = Math.min(
          400_000,
          Math.max(300, Math.hypot(latMeters, lngMeters) / 2)
        );

        const fallbackResponse = shouldFilterByCategory
          ? await getStorePreviewListByCategory(
              {
                lat: boundsCenterLat,
                lng: boundsCenterLng,
                radiusMeters: fallbackRadius,
                category,
                userLat: finalUserLat,
                userLng: finalUserLng,
              },
              signal
            )
          : await getStorePreviewList(
              {
                lat: boundsCenterLat,
                lng: boundsCenterLng,
                radiusMeters: fallbackRadius,
                userLat: finalUserLat,
                userLng: finalUserLng,
              },
              signal
            );

        return transformMapStorePreviewsToPlatforms(fallbackResponse.data);
      }
    },
    []
  );

  const loadStoreClustersInBounds = useCallback(
    async (bounds: MapBounds, category: string | null, mapLevel: number, signal?: AbortSignal) => {
      const shouldFilterByCategory = category && category !== '전체';
      const clusterResponse = await getStoreClustersInView(
        {
          minLat: bounds.minLat,
          minLng: bounds.minLng,
          maxLat: bounds.maxLat,
          maxLng: bounds.maxLng,
          category: shouldFilterByCategory ? category : undefined,
          mapLevel,
        },
        signal
      );

      return clusterResponse.data.map((cluster) => ({
        clusterId: cluster.clusterId,
        category: cluster.category,
        latitude: cluster.latitude,
        longitude: cluster.longitude,
        count: cluster.count,
      }));
    },
    []
  );

  // 함수 참조를 ref로 저장 (의존성 배열 최적화)
  const executeRef = useRef(execute);
  executeRef.current = execute;
  const loadStoresByCategoryRef = useRef(loadStoresByCategory);
  loadStoresByCategoryRef.current = loadStoresByCategory;
  const loadStoresInBoundsRef = useRef(loadStoresInBounds);
  loadStoresInBoundsRef.current = loadStoresInBounds;
  const loadStoreClustersInBoundsRef = useRef(loadStoreClustersInBounds);
  loadStoreClustersInBoundsRef.current = loadStoreClustersInBounds;

  // 초기 데이터 로드 (컴포넌트 마운트 시에만)
  useEffect(() => {
    const initializeData = async () => {
      // 1. 현재 위치 가져오기
      let coords: { lat: number; lng: number };

      try {
        coords = await getCurrentLocation();
      } catch {
        // 위치 권한 거부/미지원 환경에서도 지도를 사용할 수 있도록 서울시청을 기본 위치로 사용
        coords = { lat: 37.5665, lng: 126.978 };
        setCurrentLocation('기본 위치: 서울 중구 태평로1가');
      }

      setUserCoords(coords);
      userCoordsRef.current = coords;

      // 주소는 마커/플랫폼 응답을 막지 않도록 별도 최신 요청으로 갱신한다.
      void updateAddressLatest(coords.lat, coords.lng);
      const platforms = await loadStoresByCategoryRef.current(
        coords.lat,
        coords.lng,
        DEFAULT_RADIUS,
        null // 초기 로드는 전체 카테고리
      );

      return platforms; // 데이터 반환
    };

    executeRef.current(initializeData, () => {
      // 지도 viewport 조회가 이미 시작됐다면 느린 초기 응답으로 최신 스냅샷을 지우지 않는다.
      if (viewportRequestSeqRef.current === 0) {
        clearMapClusterSnapshot();
      }
    });
  }, [clearMapClusterSnapshot, updateAddressLatest]);

  // 카테고리 변경 시에만 반응하는 useEffect (초기 로드 제외)
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 초기 로드 완료 감지
  useEffect(() => {
    if (userCoords && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [userCoords, isInitialLoad]);

  // isInitialLoad 참조를 ref로 저장 (의존성 배열 최적화)
  const isInitialLoadRef = useRef(isInitialLoad);
  isInitialLoadRef.current = isInitialLoad;

  // 카테고리나 맵레벨 변경 시에만 실행 (초기 로드 제외)
  useEffect(() => {
    if (isInitialLoadRef.current) {
      return; // 초기 로드 중이면 스킵
    }

    // 카테고리 변경 시에만 실행되는 재로드
    const reloadByCategory = async (): Promise<Platform[]> => {
      const { controller, requestSeq } = beginViewportRequest();

      // 지도 중심이 있으면 지도 중심 사용, 없으면 사용자 위치 사용
      const coords = mapCenterRef.current || userCoordsRef.current;

      if (!coords) {
        // 좌표가 없으면 빈 배열 반환 (마커 제거)
        return [];
      }

      const bounds = currentMapBoundsRef.current;
      if (bounds && shouldUseServerClusters(currentMapLevelInHook)) {
        const clusters = await loadStoreClustersInBoundsRef.current(
          bounds,
          selectedCategory,
          currentMapLevelInHook,
          controller.signal
        );
        if (isLatestViewportRequest(requestSeq, controller.signal)) {
          commitMapClusterSnapshot(clusters);
        }
        return platformsRef.current;
      }

      clearMapClusterSnapshot();
      const inViewOptions = getInViewPreviewOptionsByMapLevel(currentMapLevelInHook);
      const platforms = bounds
        ? await loadStoresInBoundsRef.current(
            bounds,
            selectedCategory,
            undefined,
            undefined,
            inViewOptions.limit,
            inViewOptions.includeBenefits,
            inViewOptions.boundsPaddingRatio,
            controller.signal
          )
        : await loadStoresByCategoryRef.current(
            coords.lat,
            coords.lng,
            getRadiusByMapLevel(currentMapLevelInHook),
            selectedCategory,
            undefined,
            undefined,
            controller.signal
          );
      if (!isLatestViewportRequest(requestSeq, controller.signal)) {
        return platformsRef.current;
      }

      return platforms || []; // null/undefined 방어
    };

    executeRef.current(reloadByCategory);
  }, [
    beginViewportRequest,
    clearMapClusterSnapshot,
    commitMapClusterSnapshot,
    currentMapLevelInHook,
    isLatestViewportRequest,
    selectedCategory,
  ]);

  /**
   * 지도 중심 위치 변경 시 주소 정보만 업데이트 (사용자 위치는 유지)
   */
  const updateLocationFromMap = useCallback(
    (lat: number, lng: number) => updateAddressLatest(lat, lng),
    [updateAddressLatest]
  );

  /**
   * 카테고리 필터링
   * 카테고리 변경 시 useEffect가 자동으로 새 데이터를 로드함
   */
  const filterByCategory = useCallback(
    (category: string | null, mapLevel: number) => {
      cancelViewportRequest();
      setSelectedCategory(category);
      setCurrentMapLevelInHook(mapLevel);
    },
    [cancelViewportRequest]
  );

  /**
   * 카테고리 상태만 설정 (useEffect 트리거하지 않음)
   */
  const setCategoryOnly = useCallback(
    (category: string | null, mapLevel: number) => {
      cancelViewportRequest();
      setSelectedCategory(category);
      setCurrentMapLevelInHook(mapLevel);
    },
    [cancelViewportRequest]
  );

  /**
   * 현재 지도 영역에서 가맹점 검색 (수동 검색)
   * 지도 레벨에 따른 반경으로 검색하되, 사용자 위치는 업데이트하지 않음
   */
  const searchInCurrentMap = useCallback(
    async (centerLat: number, centerLng: number, mapLevel: number, bounds?: MapBounds) => {
      const { controller, requestSeq } = beginViewportRequest();
      void updateAddressLatest(centerLat, centerLng);

      const searchInMap = async () => {
        const currentUserCoords = userCoordsRef.current;
        const searchBounds = bounds ?? currentMapBoundsRef.current;

        if (searchBounds && shouldUseServerClusters(mapLevel)) {
          const clusters = await loadStoreClustersInBoundsRef.current(
            searchBounds,
            selectedCategory,
            mapLevel,
            controller.signal
          );
          if (isLatestViewportRequest(requestSeq, controller.signal)) {
            commitMapClusterSnapshot(clusters);
          }
          return platformsRef.current;
        }

        const inViewOptions = getInViewPreviewOptionsByMapLevel(mapLevel);
        const platforms = searchBounds
          ? await loadStoresInBoundsRef.current(
              searchBounds,
              selectedCategory,
              currentUserCoords?.lat,
              currentUserCoords?.lng,
              inViewOptions.limit,
              inViewOptions.includeBenefits,
              inViewOptions.boundsPaddingRatio,
              controller.signal
            )
          : await loadStoresByCategoryRef.current(
              centerLat,
              centerLng,
              getRadiusByMapLevel(mapLevel),
              selectedCategory,
              currentUserCoords?.lat,
              currentUserCoords?.lng,
              controller.signal
            );

        if (!isLatestViewportRequest(requestSeq, controller.signal)) {
          return platformsRef.current;
        }

        return platforms;
      };

      const shouldLoadServerSnapshot = Boolean(
        (bounds ?? currentMapBoundsRef.current) && shouldUseServerClusters(mapLevel)
      );
      await executeRef.current(
        searchInMap,
        shouldLoadServerSnapshot
          ? undefined
          : () => {
              if (isLatestViewportRequest(requestSeq, controller.signal)) {
                clearMapClusterSnapshot();
              }
            }
      );
    },
    [
      beginViewportRequest,
      clearMapClusterSnapshot,
      commitMapClusterSnapshot,
      isLatestViewportRequest,
      selectedCategory,
      updateAddressLatest,
    ]
  );

  /**
   * 현재 지도 화면 영역 기준 가맹점 검색
   */
  const searchInMapBounds = useCallback(
    async (bounds: MapBounds, centerLat: number, centerLng: number, mapLevel?: number) => {
      currentMapBoundsRef.current = bounds;
      const { controller, requestSeq } = beginViewportRequest();
      void updateAddressLatest(centerLat, centerLng);

      const effectiveMapLevel = mapLevel ?? currentMapLevelInHook;

      if (shouldUseServerClusters(effectiveMapLevel)) {
        try {
          const clusters = await loadStoreClustersInBoundsRef.current(
            bounds,
            selectedCategory,
            effectiveMapLevel,
            controller.signal
          );

          if (isLatestViewportRequest(requestSeq, controller.signal)) {
            commitMapClusterSnapshot(clusters);
            return true;
          }
          return false;
        } catch (error) {
          if (isLatestViewportRequest(requestSeq, controller.signal)) {
            console.error('지도 클러스터 조회 실패:', error);
          }
          return false;
        }
      }

      const searchInBounds = async () => {
        const inViewOptions = getInViewPreviewOptionsByMapLevel(effectiveMapLevel);
        const platforms = await loadStoresInBoundsRef.current(
          bounds,
          selectedCategory,
          undefined,
          undefined,
          inViewOptions.limit,
          inViewOptions.includeBenefits,
          inViewOptions.boundsPaddingRatio,
          controller.signal
        );

        if (!isLatestViewportRequest(requestSeq, controller.signal)) {
          return platformsRef.current;
        }

        return platforms;
      };

      // 상세 핀 응답이 성공한 시점에만 기존 서버 클러스터를 같이 해제한다.
      const didCommit = await executeRef.current(searchInBounds, () => {
        if (isLatestViewportRequest(requestSeq, controller.signal)) {
          clearMapClusterSnapshot();
        }
      });
      return didCommit && isLatestViewportRequest(requestSeq, controller.signal);
    },
    [
      beginViewportRequest,
      clearMapClusterSnapshot,
      commitMapClusterSnapshot,
      currentMapLevelInHook,
      isLatestViewportRequest,
      selectedCategory,
      updateAddressLatest,
    ]
  );

  /**
   * 현재 위치 버튼 클릭 시 사용자 위치 업데이트 및 데이터 재로드
   */
  const updateToCurrentLocation = useCallback(
    async (lat: number, lng: number, mapLevel: number) => {
      cancelViewportRequest();
      clearMapClusterSnapshot();
      void updateAddressLatest(lat, lng);

      const updateCurrentLocation = async () => {
        // 사용자 좌표는 즉시 갱신하고, 주소는 매장 조회와 독립적으로 반영한다.
        const coords = { lat, lng };
        setUserCoords(coords);
        userCoordsRef.current = coords;

        return loadStoresByCategoryRef.current(
          lat,
          lng,
          getRadiusByMapLevel(mapLevel),
          selectedCategory
        );
      };

      await executeRef.current(updateCurrentLocation);
    },
    [cancelViewportRequest, clearMapClusterSnapshot, selectedCategory, updateAddressLatest]
  );

  /**
   * 키워드 검색
   * 지정된 좌표와 맵레벨을 기준으로 검색
   */
  const searchByKeyword = useCallback(
    async (keyword: string, mapLevel: number, searchLat: number, searchLng: number) => {
      cancelViewportRequest();
      clearMapClusterSnapshot();
      const keywordSearch = async () => {
        // 맵 레벨에 따른 반경 계산
        const radius = getRadiusByMapLevel(mapLevel);

        // 현재 사용자 위치 가져오기
        const currentUserCoords = userCoordsRef.current;

        // 검색어가 비어있으면 전체 가맹점 조회 (검색 위치와 사용자 위치 분리)
        if (!keyword.trim()) {
          const storeResponse =
            selectedCategory && selectedCategory !== '전체'
              ? await getStorePreviewListByCategory({
                  lat: searchLat, // 검색 중심 좌표
                  lng: searchLng, // 검색 중심 좌표
                  radiusMeters: radius,
                  category: selectedCategory,
                  userLat: currentUserCoords?.lat, // 사용자 실제 위치
                  userLng: currentUserCoords?.lng, // 사용자 실제 위치
                })
              : await getStorePreviewList({
                  lat: searchLat, // 검색 중심 좌표
                  lng: searchLng, // 검색 중심 좌표
                  radiusMeters: radius,
                  userLat: currentUserCoords?.lat, // 사용자 실제 위치
                  userLng: currentUserCoords?.lng, // 사용자 실제 위치
                });

          return transformMapStorePreviewsToPlatforms(storeResponse.data);
        }

        // 키워드 검색 API 호출 (검색 위치와 사용자 위치 분리)
        const storeResponse = await searchStorePreviews({
          lat: searchLat, // 검색 중심 좌표
          lng: searchLng, // 검색 중심 좌표
          category: selectedCategory || undefined,
          keyword: keyword.trim(),
          userLat: currentUserCoords?.lat, // 사용자 실제 위치
          userLng: currentUserCoords?.lng, // 사용자 실제 위치
        });

        return transformMapStorePreviewsToPlatforms(storeResponse.data);
      };

      await executeRef.current(keywordSearch);
    },
    [cancelViewportRequest, clearMapClusterSnapshot, selectedCategory]
  );

  const clearPlatforms = useCallback(() => {
    cancelViewportRequest();
    clearMapClusterSnapshot();
    return executeRef.current(async () => []);
  }, [cancelViewportRequest, clearMapClusterSnapshot]);

  return {
    platforms: platforms || [], // null 방어
    mapClusters,
    isMapClusterSnapshotReady,
    currentLocation,
    userCoords,
    isLoading,
    error,
    selectedCategory,
    updateLocationFromMap,
    filterByCategory,
    setCategoryOnly,
    searchInCurrentMap,
    searchInMapBounds,
    searchByKeyword,
    updateToCurrentLocation,
    currentMapLevelInHook,
    clearPlatforms,
  };
};
