import { Platform } from '../types';
import { MapStorePreviewData, StoreData } from '../types/api';
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
