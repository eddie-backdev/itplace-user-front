import type { QuestionRecommendationData } from '../../../types/questionRecommendation';

export function consumeQuestionRecommendationStream(
  stream: ReadableStream<Uint8Array>,
  handlers?: {
    onStatus?: (stage: 'planning' | 'searching' | 'answering') => void;
    onCards?: (data: QuestionRecommendationData) => void;
    onDone?: (data: QuestionRecommendationData) => void;
  }
): Promise<void>;
