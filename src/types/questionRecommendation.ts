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
  candidateKey?: string;
  policyId?: number;
  tierBenefitId?: number;
  carrier?: string;
  grade?: string;
  usageType?: string;
  sourceUrl?: string;
  sourceCapturedAt?: string;
  offerResolution?: 'SINGLE' | 'SCOPED' | 'PARTIAL' | 'UNRESOLVED';
  normalizationIssues?: Array<{ code: string; message: string; sourceText?: string | null; sourcePath?: string | null }>;
  sourceBlocks?: Array<{ path: string; parentPath?: string | null; kind: string; heading?: string | null; text: string }>;
}

export type QuestionRecommendationRole = 'user' | 'assistant';
export type QuestionRecommendationStatus =
  | 'ANSWER'
  | 'CLARIFICATION'
  | 'NO_RESULTS'
  | 'UNAVAILABLE'
  | 'OUT_OF_SCOPE';

export interface QuestionRecommendationMessage {
  role: QuestionRecommendationRole;
  content: string;
}

export interface QuestionRecommendationData {
  reason: string;
  partners: QuestionRecommendationPartner[];
  status: QuestionRecommendationStatus;
  suggestedQuestions: string[];
  traceId: string;
}

export interface QuestionRecommendationSuccessResponse {
  code: 'QUESTION_SUCCESS';
  status: string;
  message: string;
  data: QuestionRecommendationData;
  timestamp: string;
}

export interface QuestionRecommendationErrorResponse {
  code: string;
  status: string;
  message: string;
  data: null;
  timestamp: string;
}

export interface QuestionRecommendationRequest {
  question: string;
  messages: QuestionRecommendationMessage[];
  previousCandidateKeys: string[];
  lat?: number;
  lng?: number;
  carrier?: string;
  grade?: string;
}
