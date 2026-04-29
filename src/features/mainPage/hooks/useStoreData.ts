import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from '../types';
import {
  getStoreList,
  getStoreListByCategory,
  getCurrentLocation,
  getAddressFromCoordinates,
  searchStores,
} from '../api/storeApi';
import { transformStoreDataToPlatforms } from '../utils/dataTransform';
import { getRadiusByMapLevel } from '../utils/mapUtils';
import { useApiCall } from './useApiCall';
import { DEFAULT_RADIUS } from '../constants';

/**
 * 가맹점 데이터 관리 훅
 * 위치 기반 가맹점 검색, 카테고리 필터링, 지도 연동 기능 제공
 */
export const useStoreData = (mapCenter?: { lat: number; lng: number } | null) => {
  // API 상태 관리
  const { data: platforms, isLoading, error, execute } = useApiCall<Platform[]>([]);

  // 위치 관련 상태
  const [currentLocation, setCurrentLocation] = useState<string>('위치 정보 로딩 중...');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // userCoords의 최신 값을 참조하기 위한 ref
  const userCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // mapCenter의 최신 값을 참조하기 위한 ref
  const mapCenterRef = useRef<{ lat: number; lng: number } | null>(mapCenter);
  mapCenterRef.current = mapCenter;

  // 카테고리 필터 상태
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentMapLevelInHook, setCurrentMapLevelInHook] = useState<number>(2); // 지도 레벨 상태 추가

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
      userLng?: number
    ) => {
      const shouldFilterByCategory = category && category !== '전체';

      // 사용자 위치: 파라미터로 전달되면 사용, 없으면 현재 저장된 사용자 위치 사용
      const currentUserCoords = userCoordsRef.current;
      const finalUserLat = userLat !== undefined ? userLat : currentUserCoords?.lat;
      const finalUserLng = userLng !== undefined ? userLng : currentUserCoords?.lng;

      const storeResponse = shouldFilterByCategory
        ? await getStoreListByCategory({
            lat,
            lng,
            radiusMeters: radius,
            category,
            userLat: finalUserLat,
            userLng: finalUserLng,
          })
        : await getStoreList({
            lat,
            lng,
            radiusMeters: radius,
            userLat: finalUserLat,
            userLng: finalUserLng,
          });

      return transformStoreDataToPlatforms(storeResponse.data);
    },
    []
  );

  /**
   * 좌표 업데이트 및 주소 변환 공통 함수
   */
  const updateLocationInfo = useCallback(async (lat: number, lng: number) => {
    const coords = { lat, lng };
    setUserCoords(coords);
    userCoordsRef.current = coords; // ref도 업데이트
    try {
      const address = await getAddressFromCoordinates(lat, lng);
      setCurrentLocation(address);
    } catch {
      // 주소 변환 실패 시 무시 (지도는 정상 동작)
    }
  }, []);

  // 함수 참조를 ref로 저장 (의존성 배열 최적화)
  const executeRef = useRef(execute);
  executeRef.current = execute;
  const loadStoresByCategoryRef = useRef(loadStoresByCategory);
  loadStoresByCategoryRef.current = loadStoresByCategory;
  const updateLocationInfoRef = useRef(updateLocationInfo);
  updateLocationInfoRef.current = updateLocationInfo;

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

      await updateLocationInfoRef.current(coords.lat, coords.lng);

      // 2. 근처 제휴처 데이터 로드 (초기에는 전체 카테고리)
      const platforms = await loadStoresByCategoryRef.current(
        coords.lat,
        coords.lng,
        DEFAULT_RADIUS,
        null // 초기 로드는 전체 카테고리
      );

      return platforms; // 데이터 반환
    };

    executeRef.current(initializeData);
  }, []); // 빈 의존성 배열로 초기 로드만 실행

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
      // 지도 중심이 있으면 지도 중심 사용, 없으면 사용자 위치 사용
      const coords = mapCenterRef.current || userCoordsRef.current;

      if (!coords) {
        // 좌표가 없으면 빈 배열 반환 (마커 제거)
        return [];
      }

      const platforms = await loadStoresByCategoryRef.current(
        coords.lat,
        coords.lng,
        getRadiusByMapLevel(currentMapLevelInHook),
        selectedCategory
      );
      return platforms || []; // null/undefined 방어
    };

    executeRef.current(reloadByCategory);
  }, [selectedCategory, currentMapLevelInHook]);

  /**
   * 지도 중심 위치 변경 시 주소 정보만 업데이트 (사용자 위치는 유지)
   */
  const updateLocationFromMap = useCallback(async (lat: number, lng: number) => {
    try {
      const address = await getAddressFromCoordinates(lat, lng);
      setCurrentLocation(address);
    } catch {
      // 주소 변환 실패 시 무시
    }
  }, []);

  /**
   * 카테고리 필터링
   * 카테고리 변경 시 useEffect가 자동으로 새 데이터를 로드함
   */
  const filterByCategory = useCallback((category: string | null, mapLevel: number) => {
    setSelectedCategory(category);
    setCurrentMapLevelInHook(mapLevel);
  }, []);

  /**
   * 카테고리 상태만 설정 (useEffect 트리거하지 않음)
   */
  const setCategoryOnly = useCallback((category: string | null, mapLevel: number) => {
    setSelectedCategory(category);
    setCurrentMapLevelInHook(mapLevel);
  }, []);

  /**
   * 현재 지도 영역에서 가맹점 검색 (수동 검색)
   * 지도 레벨에 따른 반경으로 검색하되, 사용자 위치는 업데이트하지 않음
   */
  const searchInCurrentMap = useCallback(
    async (centerLat: number, centerLng: number, mapLevel: number) => {
      const searchInMap = async () => {
        // 맵 레벨에 따른 반경 계산
        const radius = getRadiusByMapLevel(mapLevel);

        // 현재 사용자 위치 가져오기
        const currentUserCoords = userCoordsRef.current;

        // 가맹점 검색 (지도 중심 좌표 기준, 사용자 위치는 별도 전달)
        const platforms = await loadStoresByCategoryRef.current(
          centerLat, // 검색 중심 좌표
          centerLng, // 검색 중심 좌표
          radius,
          selectedCategory,
          currentUserCoords?.lat, // 사용자 실제 위치
          currentUserCoords?.lng // 사용자 실제 위치
        );

        // 사용자 위치는 업데이트하지 않음 (기존 userCoords 유지)
        // 단, 현재 위치 텍스트만 업데이트 (주소 표시용)
        try {
          const address = await getAddressFromCoordinates(centerLat, centerLng);
          setCurrentLocation(address);
        } catch {
          // 주소 변환 실패 시 무시
        }

        return platforms;
      };

      await executeRef.current(searchInMap);
    },
    [selectedCategory]
  );

  /**
   * 현재 위치 버튼 클릭 시 사용자 위치 업데이트 및 데이터 재로드
   */
  const updateToCurrentLocation = useCallback(
    async (lat: number, lng: number, mapLevel: number) => {
      const updateCurrentLocation = async () => {
        // 사용자 위치 업데이트
        await updateLocationInfoRef.current(lat, lng);

        // 새로운 위치 기준으로 가맹점 데이터 로드
        const platforms = await loadStoresByCategoryRef.current(
          lat,
          lng,
          getRadiusByMapLevel(mapLevel),
          selectedCategory
        );

        return platforms;
      };

      await executeRef.current(updateCurrentLocation);
    },
    [selectedCategory]
  );

  /**
   * 키워드 검색
   * 지정된 좌표와 맵레벨을 기준으로 검색
   */
  const searchByKeyword = useCallback(
    async (keyword: string, mapLevel: number, searchLat: number, searchLng: number) => {
      const keywordSearch = async () => {
        // 맵 레벨에 따른 반경 계산
        const radius = getRadiusByMapLevel(mapLevel);

        // 현재 사용자 위치 가져오기
        const currentUserCoords = userCoordsRef.current;

        // 검색어가 비어있으면 전체 가맹점 조회 (검색 위치와 사용자 위치 분리)
        if (!keyword.trim()) {
          const storeResponse =
            selectedCategory && selectedCategory !== '전체'
              ? await getStoreListByCategory({
                  lat: searchLat, // 검색 중심 좌표
                  lng: searchLng, // 검색 중심 좌표
                  radiusMeters: radius,
                  category: selectedCategory,
                  userLat: currentUserCoords?.lat, // 사용자 실제 위치
                  userLng: currentUserCoords?.lng, // 사용자 실제 위치
                })
              : await getStoreList({
                  lat: searchLat, // 검색 중심 좌표
                  lng: searchLng, // 검색 중심 좌표
                  radiusMeters: radius,
                  userLat: currentUserCoords?.lat, // 사용자 실제 위치
                  userLng: currentUserCoords?.lng, // 사용자 실제 위치
                });

          return transformStoreDataToPlatforms(storeResponse.data);
        }

        // 키워드 검색 API 호출 (검색 위치와 사용자 위치 분리)
        const storeResponse = await searchStores({
          lat: searchLat, // 검색 중심 좌표
          lng: searchLng, // 검색 중심 좌표
          category: selectedCategory || undefined,
          keyword: keyword.trim(),
          userLat: currentUserCoords?.lat, // 사용자 실제 위치
          userLng: currentUserCoords?.lng, // 사용자 실제 위치
        });

        return transformStoreDataToPlatforms(storeResponse.data);
      };

      await executeRef.current(keywordSearch);
    },
    [selectedCategory]
  );

  return {
    platforms: platforms || [], // null 방어
    currentLocation,
    userCoords,
    isLoading,
    error,
    selectedCategory,
    updateLocationFromMap,
    filterByCategory,
    setCategoryOnly,
    searchInCurrentMap,
    searchByKeyword,
    updateToCurrentLocation,
    currentMapLevelInHook,
    clearPlatforms: () => execute(async () => []), // 즉시 빈 배열로 설정
  };
};
