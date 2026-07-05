import api from '../../../apis/axiosInstance';
import {
  StoreApiResponse,
  StoreListParams,
  SearchStoresParams,
  ReverseGeocodeApiResponse,
  MapStorePreviewApiResponse,
  MapStoreClusterApiResponse,
  StoreClusterInViewParams,
  StoreInViewParams,
} from '../types/api';

/**
 * 현재 지도 화면 영역 기반 클러스터 목록 조회 - 넓은 줌 레벨 전용 경량 응답
 */
export const getStoreClustersInView = async (
  params: StoreClusterInViewParams
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
  });

  return response.data;
};

/**
 * 현재 지도 화면 영역 기반 지점 목록 조회 - 지도 카드 표시용 경량 응답
 */
export const getStorePreviewsInView = async (
  params: StoreInViewParams
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
  });

  return response.data;
};

/**
 * 사용자 위치 기반 전체 지점 목록 조회 - 지도 카드 표시용 경량 응답
 */
export const getStorePreviewList = async (
  params: StoreListParams & { userLat?: number; userLng?: number }
): Promise<MapStorePreviewApiResponse> => {
  const response = await api.get('/api/v1/maps/nearby/previews', {
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
 * 사용자 위치 기반 카테고리별 지점 목록 조회 - 지도 카드 표시용 경량 응답
 */
export const getStorePreviewListByCategory = async (
  params: StoreListParams & { category?: string; userLat?: number; userLng?: number }
): Promise<MapStorePreviewApiResponse> => {
  const response = await api.get('/api/v1/maps/nearby/category/previews', {
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
 * 키워드 검색을 통한 지점 목록 조회 - 지도 카드 표시용 경량 응답
 */
export const searchStorePreviews = async (
  params: SearchStoresParams & { userLat?: number; userLng?: number }
): Promise<MapStorePreviewApiResponse> => {
  const response = await api.get('/api/v1/maps/nearby/search/previews', {
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
export const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await api.get<ReverseGeocodeApiResponse>('/api/v1/maps/address', {
      params: { lat, lng },
    });

    return response.data.data?.addressName || '현재 위치';
  } catch {
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
