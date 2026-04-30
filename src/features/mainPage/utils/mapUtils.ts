/**
 * 지도 관련 유틸리티 함수들
 */

/**
 * 맵 레벨에 따른 검색 반경 계산
 * 지도 확대/축소 레벨에 따라 적절한 검색 반경을 반환
 * @param mapLevel 지도 레벨 (1: 최대확대 ~ 14: 최대축소)
 * @returns 검색 반경(미터)
 */
export const getRadiusByMapLevel = (mapLevel: number): number => {
  // 맵 레벨이 작을수록(확대) 작은 반경, 클수록(축소) 큰 반경
  const radiusMap: { [key: number]: number } = {
    1: 300, // 최대 확대 - 500m
    2: 500, // 0.1km (기본값)
    3: 850, // 0.2km
    4: 2000, // 0.3km
    5: 3500, // 0.5km
    6: 5500, // 0.7km
    7: 8000, // 1km
    8: 18000, // 18km
    9: 30000, // 30km
    10: 80000, // 80km
    11: 100000, // 100km
    12: 200000, // 200km
    13: 300000, // 300km
    14: 400000, // 400km - 최대 축소
  };

  return radiusMap[mapLevel] || 50; // 기본값 1km
};
