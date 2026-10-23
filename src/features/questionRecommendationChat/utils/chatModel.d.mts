import type { QuestionRecommendationMessage, QuestionRecommendationPartner } from '../../../types/questionRecommendation';

interface ChatModelMessage {
  sender: 'user' | 'bot';
  text: string;
  includeInHistory?: boolean;
  retry?: unknown;
  partners?: QuestionRecommendationPartner[];
}

export function buildChatHistory(messages: ChatModelMessage[], initialMessage: string): QuestionRecommendationMessage[];
export function getPreviousCandidateKeys(messages: ChatModelMessage[]): string[];
export function groupPartnersByBrand(partners: QuestionRecommendationPartner[]): Array<{
  key: string;
  partnerName: string;
  partners: QuestionRecommendationPartner[];
}>;
export function buildBrandCardSummary(partners: QuestionRecommendationPartner[]): {
  benefitName: string;
  carriers: string[];
  carrier?: string;
  grade?: string;
  usageType?: string;
  needsConfirmation: boolean;
  storeCount?: number;
  category?: string;
};
export function createRetryContext(question: string, messages: QuestionRecommendationMessage[], previousCandidateKeys: string[]): {
  question: string;
  messages: QuestionRecommendationMessage[];
  previousCandidateKeys: string[];
};
export function normalizeStoredChatMessages(value: unknown): Array<{
  sender: 'user' | 'bot';
  text: string;
  includeInHistory?: boolean;
  partners?: QuestionRecommendationPartner[];
  suggestedQuestions?: string[];
  retry?: { question: string; messages: QuestionRecommendationMessage[]; previousCandidateKeys: string[] };
}>;
export function createRequestGeneration(): {
  begin(): number;
  cancel(): number;
  isCurrent(candidate: number): boolean;
};
export function safeHttpUrl(value?: string): string | undefined;
