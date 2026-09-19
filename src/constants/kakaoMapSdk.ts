export const KAKAO_MAP_READY_EVENT = 'itplace:kakao-map-ready';
export const KAKAO_MAP_ERROR_EVENT = 'itplace:kakao-map-error';
export const KAKAO_MAP_STATUS_ATTRIBUTE = 'itplaceKakaoMapStatus';
export const KAKAO_MAP_LOAD_TIMEOUT_MS = 10_000;

export type KakaoMapSdkStatus = 'idle' | 'loading' | 'ready' | 'error';

export const getKakaoMapSdkStatus = (): KakaoMapSdkStatus => {
  if (typeof document === 'undefined') return 'idle';
  const status = document.documentElement.dataset[KAKAO_MAP_STATUS_ATTRIBUTE];
  return status === 'loading' || status === 'ready' || status === 'error' ? status : 'idle';
};

export const setKakaoMapSdkStatus = (status: KakaoMapSdkStatus) => {
  document.documentElement.dataset[KAKAO_MAP_STATUS_ATTRIBUTE] = status;
};
