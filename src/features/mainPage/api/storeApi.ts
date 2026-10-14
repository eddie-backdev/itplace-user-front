import api from '../../../apis/axiosInstance';
import { isAxiosError } from 'axios';
import { expandMapStorePreviewBatch } from '../utils/dataTransform';
import {
  StoreApiResponse,
  StoreListParams,
  SearchStoresParams,
  ReverseGeocodeApiResponse,
  MapStorePreviewApiResponse,
  MapStorePreviewData,
  MapStorePreviewBatchApiResponse,
  MapStoreClusterApiResponse,
  MapStorePreviewPageApiResponse,
  StoreClusterInViewParams,
  StoreInViewParams,
  CompactStoreInViewParams,
  StorePreviewInViewPageParams,
  NearbyStorePreviewPageParams,
} from '../types/api';

const MAP_PREVIEW_PAGE_SIZE = 300;

const throwIfAborted = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new DOMException('요청이 취소되었습니다.', 'AbortError');
};

const getAllCompactStorePreviewPages = async (
  path: string,
  params: Record<string, string | number | undefined>,
  userLat: number,
  userLng: number,
  signal?: AbortSignal
): Promise<MapStorePreviewApiResponse> => {
  const storesById = new Map<number, MapStorePreviewData>();
  let afterStoreId = 0;
  let envelope: Omit<MapStorePreviewApiResponse, 'data'> | null = null;

  while (true) {
    throwIfAborted(signal);
    const response = await api.get<MapStorePreviewPageApiResponse>(path, {
      params: { ...params, pageSize: MAP_PREVIEW_PAGE_SIZE, afterStoreId },
      signal,
    });
    throwIfAborted(signal);
    const page = response.data?.data;
    if (
      !page ||
      !Array.isArray(page.stores) ||
      !Array.isArray(page.partners) ||
      typeof page.hasMore !== 'boolean' ||
      !(page.nextCursor === null || Number.isSafeInteger(page.nextCursor))
    ) {
      throw new Error('지도 지점 페이지 응답 형식이 올바르지 않습니다.');
    }
    if (page.hasMore && (page.nextCursor === null || page.nextCursor <= afterStoreId)) {
      throw new Error('지도 지점 페이지 커서가 다음 페이지로 진행하지 않습니다.');
    }
    if (!page.hasMore && page.nextCursor !== null) {
      throw new Error('마지막 지도 지점 페이지에 잘못된 커서가 포함되어 있습니다.');
    }
    for (let index = 1; index < page.stores.length; index += 1) {
      if (page.stores[index - 1].storeId >= page.stores[index].storeId) {
        throw new Error('지도 지점 페이지가 ID 오름차순으로 정렬되어 있지 않습니다.');
      }
    }
    if (page.stores.some((store) => !Number.isSafeInteger(store.storeId) || store.storeId <= 0)) {
      throw new Error('지도 지점 페이지에 올바르지 않은 지점 ID가 포함되어 있습니다.');
    }
    if (page.hasMore && page.stores.length === 0) {
      throw new Error('지점이 없는 페이지에 다음 페이지가 있다고 응답했습니다.');
    }
    if (page.hasMore && page.nextCursor !== page.stores[page.stores.length - 1]?.storeId) {
      throw new Error('지도 지점 페이지 커서가 마지막 지점 ID와 일치하지 않습니다.');
    }

    envelope ??= {
      code: response.data.code,
      status: response.data.status,
      message: response.data.message,
    };
    // 제휴처 사전은 페이지마다 tier 정보가 달라질 수 있어 병합 전에 확장한다.
    for (const store of expandMapStorePreviewBatch(page, userLat, userLng)) {
      if (!storesById.has(store.storeId)) storesById.set(store.storeId, store);
    }

    if (!page.hasMore) break;
    afterStoreId = page.nextCursor!;
  }

  const stores = [...storesById.values()].sort((first, second) => first.distance - second.distance);
  return { ...envelope!, data: stores };
};

export const getAllStorePreviewsInView = (
  params: StorePreviewInViewPageParams,
  signal?: AbortSignal
): Promise<MapStorePreviewApiResponse> => {
  const { userLat, userLng, ...bounds } = params;
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLng = (bounds.minLng + bounds.maxLng) / 2;
  return getAllCompactStorePreviewPages(
    '/api/v1/maps/stores/in-view/previews/compact/page',
    bounds,
    userLat ?? centerLat,
    userLng ?? centerLng,
    signal
  );
};

export const getAllNearbyStorePreviews = (
  params: NearbyStorePreviewPageParams,
  signal?: AbortSignal
): Promise<MapStorePreviewApiResponse> => {
  const queryParams = {
    lat: params.lat,
    lng: params.lng,
    radiusMeters: params.radiusMeters,
    category: params.category,
    userLat: params.userLat ?? params.lat,
    userLng: params.userLng ?? params.lng,
  };
  const categoryPath = params.category && params.category !== '전체';
  const path = categoryPath
    ? '/api/v1/maps/nearby/category/previews/compact/page'
    : '/api/v1/maps/nearby/previews/compact/page';
  return getAllCompactStorePreviewPages(
    path,
    queryParams,
    params.userLat ?? params.lat,
    params.userLng ?? params.lng,
    signal
  );
};

const getCompactStorePreviews = async (
  legacyPath: string,
  params: {
    lat: number;
    lng: number;
    userLat?: number;
    userLng?: number;
    [key: string]: string | number | undefined;
  },
  signal?: AbortSignal
): Promise<MapStorePreviewApiResponse> => {
  try {
    const response = await api.get<MapStorePreviewBatchApiResponse>(`${legacyPath}/compact`, {
      params,
      signal,
    });
    return {
      ...response.data,
      data: expandMapStorePreviewBatch(
        response.data.data,
        params.userLat ?? params.lat,
        params.userLng ?? params.lng
      ),
    };
  } catch (error) {
    if (
      signal?.aborted ||
      !isAxiosError(error) ||
      ![404, 405].includes(error.response?.status ?? 0)
    ) {
      throw error;
    }
    // 백엔드보다 프론트가 먼저 배포된 경우에만 기존 경로를 사용한다.
    const response = await api.get<MapStorePreviewApiResponse>(legacyPath, { params, signal });
    return response.data;
  }
};

/**
 * 현재 지도 화면 영역 기반 클러스터 목록 조회 - 넓은 줌 레벨 전용 경량 응답
 */
export const getStoreClustersInView = async (
  params: StoreClusterInViewParams,
  signal?: AbortSignal
): Promise<MapStoreClusterApiResponse> => {
  const response = await api.get('/api/v1/maps/stores/in-view/clusters', {
    params: {
      minLat: params.minLat,
      minLng: params.minLng,
      maxLat: params.maxLat,
      maxLng: params.maxLng,
      category: params.category,
      mapLevel: params.mapLevel,
    },
    signal,
  });

  return response.data;
};

/**
 * 현재 지도 화면 영역 기반 지점 목록 조회 - 지도 카드 표시용 경량 응답
 */
export const getStorePreviewsInView = async (
  params: StoreInViewParams,
  signal?: AbortSignal
): Promise<MapStorePreviewApiResponse> => {
  const response = await api.get('/api/v1/maps/stores/in-view/previews', {
    params: {
      minLat: params.minLat,
      minLng: params.minLng,
      maxLat: params.maxLat,
      maxLng: params.maxLng,
      category: params.category,
      userLat: params.userLat,
      userLng: params.userLng,
      limit: params.limit,
      includeBenefits: params.includeBenefits,
    },
    signal,
  });

  return response.data;
};

/**
 * 현재 지도 화면 영역 기반 지점 목록 조회.
 * 제휴처와 혜택을 지점 목록에서 분리해 동일 브랜드 데이터의 반복 전송을 제거한다.
 */
export const getCompactStorePreviewsInView = async (
  params: CompactStoreInViewParams,
  signal?: AbortSignal
): Promise<MapStorePreviewBatchApiResponse> => {
  const response = await api.get('/api/v1/maps/stores/in-view/previews/compact', {
    params: {
      minLat: params.minLat,
      minLng: params.minLng,
      maxLat: params.maxLat,
      maxLng: params.maxLng,
      category: params.category,
      limit: params.limit,
    },
    signal,
  });

  return response.data;
};

/**
 * 사용자 위치 기반 전체 지점 목록 조회 - 지도 카드 표시용 경량 응답
 */
export const getStorePreviewList = async (
  params: StoreListParams & { userLat?: number; userLng?: number },
  signal?: AbortSignal
): Promise<MapStorePreviewApiResponse> => {
  return getCompactStorePreviews(
    '/api/v1/maps/nearby/previews',
    {
      lat: params.lat,
      lng: params.lng,
      radiusMeters: params.radiusMeters,
      userLat: params.userLat,
      userLng: params.userLng,
    },
    signal
  );
};

/**
 * 사용자 위치 기반 카테고리별 지점 목록 조회 - 지도 카드 표시용 경량 응답
 */
export const getStorePreviewListByCategory = async (
  params: StoreListParams & { category?: string; userLat?: number; userLng?: number },
  signal?: AbortSignal
): Promise<MapStorePreviewApiResponse> => {
  return getCompactStorePreviews(
    '/api/v1/maps/nearby/category/previews',
    {
      lat: params.lat,
      lng: params.lng,
      radiusMeters: params.radiusMeters,
      category: params.category,
      userLat: params.userLat,
      userLng: params.userLng,
    },
    signal
  );
};

/**
 * 키워드 검색을 통한 지점 목록 조회 - 지도 카드 표시용 경량 응답
 */
export const searchStorePreviews = async (
  params: SearchStoresParams & { userLat?: number; userLng?: number },
  signal?: AbortSignal
): Promise<MapStorePreviewApiResponse> => {
  return getCompactStorePreviews(
    '/api/v1/maps/nearby/search/previews',
    {
      lat: params.lat,
      lng: params.lng,
      category: params.category,
      keyword: params.keyword,
      userLat: params.userLat,
      userLng: params.userLng,
    },
    signal
  );
};

/**
 * 사용자 위치 기반 전체 지점 목록 조회
 */
export const getStoreList = async (
  params: StoreListParams & { userLat?: number; userLng?: number }
): Promise<StoreApiResponse> => {
  const response = await api.get('/api/v1/maps/nearby', {
    params: {
      lat: params.lat,
      lng: params.lng,
      radiusMeters: params.radiusMeters,
      userLat: params.userLat,
      userLng: params.userLng,
    },
  });

  return response.data;
};

/**
 * 사용자 위치 기반 카테고리별 지점 목록 조회
 */
export const getStoreListByCategory = async (
  params: StoreListParams & { category?: string; userLat?: number; userLng?: number }
): Promise<StoreApiResponse> => {
  const response = await api.get('/api/v1/maps/nearby/category', {
    params: {
      lat: params.lat,
      lng: params.lng,
      radiusMeters: params.radiusMeters,
      category: params.category,
      userLat: params.userLat,
      userLng: params.userLng,
    },
  });

  return response.data;
};

/**
 * 키워드 검색을 통한 지점 목록 조회
 */
export const searchStores = async (
  params: SearchStoresParams & { userLat?: number; userLng?: number }
): Promise<StoreApiResponse> => {
  const response = await api.get('/api/v1/maps/nearby/search', {
    params: {
      lat: params.lat,
      lng: params.lng,
      category: params.category,
      keyword: params.keyword,
      userLat: params.userLat,
      userLng: params.userLng,
    },
  });

  return response.data;
};

/**
 * 백엔드 프록시를 통한 좌표→주소 변환
 */
export const getAddressFromCoordinates = async (
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<string> => {
  try {
    const response = await api.get<ReverseGeocodeApiResponse>('/api/v1/maps/address', {
      params: { lat, lng },
      signal,
    });

    return response.data.data?.addressName || '현재 위치';
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }
    return '현재 위치';
  }
};

/**
 * 브라우저에서 현재 위치 가져오기
 */
export const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation이 지원되지 않는 브라우저입니다.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(`위치 정보 가져오기 실패: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5분
      }
    );
  });
};
