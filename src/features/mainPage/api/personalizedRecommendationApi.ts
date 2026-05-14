import api from '../../../apis/axiosInstance';
import { PersonalizedRecommendationResponse } from '../types/api';

// 맞춤 AI 추천 목록 중복 호출 방지
let isGlobalPersonalizedRecommendationsLoading = false;
let personalizedRecommendationsPromise: Promise<PersonalizedRecommendationResponse> | null = null;

/**
 * 맞춤 AI 추천 목록 조회
 */
export const getPersonalizedRecommendations =
  async (): Promise<PersonalizedRecommendationResponse> => {
    // 이미 진행 중인 요청이 있으면 그 결과를 반환
    if (personalizedRecommendationsPromise) {
      return personalizedRecommendationsPromise;
    }

    // 전역 중복 호출 방지 - 100ms 후 재시도
    if (isGlobalPersonalizedRecommendationsLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return getPersonalizedRecommendations(); // 재귀 호출로 재시도
    }

    isGlobalPersonalizedRecommendationsLoading = true;

    personalizedRecommendationsPromise = (async () => {
      try {
        const response = await api.get('/api/v1/recommendations');
        return response.data;
      } finally {
        isGlobalPersonalizedRecommendationsLoading = false;
        // 요청 완료 후 1초 뒤에 Promise 캐시 초기화 (너무 빠른 재요청 방지)
        setTimeout(() => {
          personalizedRecommendationsPromise = null;
        }, 1000);
      }
    })();

    return personalizedRecommendationsPromise;
  };
