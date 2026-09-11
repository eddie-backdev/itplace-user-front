import { Platform } from '../types';
import { MapStorePreviewBatchData, MapStorePreviewData, StoreData } from '../types/api';
import {
  convertStoreDataToPlatform,
  convertStorePreviewToPlatform,
  createPlatformWithoutCoords,
} from './storeUtils';

/**
 * 데이터 변환 관련 유틸리티 함수들
 */

/**
 * API 응답 데이터를 Platform 배열로 변환
 * 좌표가 있는 데이터와 없는 데이터 모두 처리
 * API에서 제공하는 거리 정보를 사용
 * @param storeDataList API에서 받은 스토어 데이터 배열
 * @returns Platform 배열
 */
export const transformStoreDataToPlatforms = (storeDataList: StoreData[]): Platform[] => {
  return storeDataList.map((storeData) => {
    const platform = convertStoreDataToPlatform(storeData);
    return platform ?? createPlatformWithoutCoords(storeData);
  });
};

/**
 * 지도 카드 표시용 경량 API 응답을 Platform 배열로 변환
 * 혜택 문구는 유지하고, 지도/주변 혜택 탭에 필요한 필드만 사용한다.
 */
export const transformMapStorePreviewsToPlatforms = (
  storePreviewList: MapStorePreviewData[]
): Platform[] => {
  return storePreviewList.map(convertStorePreviewToPlatform);
};

const calculateDistanceKm = (
  userLat: number,
  userLng: number,
  storeLat: number,
  storeLng: number
) => {
  const earthRadiusMeters = 6_378_137;
  const latitudeDelta = ((storeLat - userLat) * Math.PI) / 180;
  const longitudeDelta = ((storeLng - userLng) * Math.PI) / 180;
  const startLatitude = (userLat * Math.PI) / 180;
  const endLatitude = (storeLat * Math.PI) / 180;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  const distanceMeters =
    earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return Math.round((distanceMeters / 1000) * 10) / 10;
};

/**
 * Compact 응답을 기존 preview 형태로 확장하며 서버의 지점 순서를 보존한다.
 * 거리 없는 viewport 응답만 사용자 위치로 거리를 계산한다.
 */
export const expandMapStorePreviewBatch = (
  batch: MapStorePreviewBatchData,
  userLat: number,
  userLng: number
): MapStorePreviewData[] => {
  const partnerById = new Map(batch.partners.map((partner) => [partner.partnerId, partner]));

  return batch.stores.map((store) => {
    const partner = partnerById.get(store.partnerId);
    return {
      ...store,
      partnerName: partner?.partnerName ?? store.storeName,
      category: partner?.category ?? '',
      image: partner?.image,
      roadName: store.roadName ?? null,
      tierBenefit: store.tierBenefit ?? partner?.tierBenefit ?? [],
      distance:
        store.distance ?? calculateDistanceKm(userLat, userLng, store.latitude, store.longitude),
    };
  });
};

/** Viewport의 기존 동작인 사용자 거리순 정렬은 이 경로에서만 적용한다. */
export const transformMapStorePreviewBatchToPlatforms = (
  batch: MapStorePreviewBatchData,
  userLat: number,
  userLng: number
): Platform[] => {
  return expandMapStorePreviewBatch(batch, userLat, userLng)
    .map(convertStorePreviewToPlatform)
    .sort((first, second) => first.distance - second.distance);
};
