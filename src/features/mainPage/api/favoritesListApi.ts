import axiosInstance from '../../../apis/axiosInstance';
import { store } from '../../../store';
import { FavoritesListRequest, FavoriteBenefit } from '../types/api';

// 진행 중인 요청들을 저장 (파라미터별로 관리)
const ongoingRequests = new Map<string, Promise<FavoriteBenefit[]>>();

export const getFavoritesList = async (
  params: FavoritesListRequest
): Promise<FavoriteBenefit[]> => {
  const state = store.getState();
  if (!state._persist?.rehydrated || !state.auth.isLoggedIn) return [];

  const paramsKey = JSON.stringify(params);

  // 같은 파라미터로 이미 진행 중인 요청이 있으면 그 결과를 반환
  if (ongoingRequests.has(paramsKey)) {
    return ongoingRequests.get(paramsKey)!;
  }

  // 새 요청 시작
  const requestPromise = (async () => {
    try {
      const response = await axiosInstance.get('/api/v1/favorites/search', {
        params: {
          ...(params.category && params.category !== '전체' && { category: params.category }),
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('즐겨찾기 목록 조회 실패:', error);
      throw error;
    } finally {
      // 요청 완료 후 맵에서 제거
      ongoingRequests.delete(paramsKey);
    }
  })();

  // 진행 중인 요청 맵에 추가
  ongoingRequests.set(paramsKey, requestPromise);

  return requestPromise;
};
