export interface QuestionRecommendationPartner {
  partnerId?: number;
  benefitId?: number;
  partnerName: string;
  benefitName?: string;
  category?: string;
  representativeStoreId?: number;
  representativeStoreName?: string;
  storeCount?: number;
  benefitText?: string;
  imgUrl?: string;
}

export interface QuestionRecommendationData {
  reason: string;
  partners: QuestionRecommendationPartner[];
}

export interface QuestionRecommendationSuccessResponse {
  code: 'QUESTION_SUCCESS';
  status: 'OK';
  message: string;
  data: QuestionRecommendationData;
  timestamp: string;
}

export interface QuestionRecommendationErrorResponse {
  code: 'FORBIDDEN_WORD_DETECTED' | 'NO_STORE_FOUND' | string;
  status: 'BAD_REQUEST' | 'NOT_FOUND' | string;
  message: string;
  data: null;
  timestamp: string;
}

export interface QuestionRecommendationRequest {
  question: string;
  lat: number;
  lng: number;
}
