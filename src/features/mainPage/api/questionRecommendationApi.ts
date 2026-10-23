import axios from 'axios';
import api from '../../../apis/axiosInstance';
import type {
  QuestionRecommendationRequest,
  QuestionRecommendationSuccessResponse,
  QuestionRecommendationData,
} from '../../../types/questionRecommendation';
import { consumeQuestionRecommendationStream } from '../../questionRecommendationChat/utils/questionRecommendationStream.mjs';

const CHAT_REQUEST_TIMEOUT_MS = 45_000;

const cancelResponseBody = async (body: unknown) => {
  if (!body || typeof body !== 'object') return;
  const stream = body as {
    getReader?: () => ReadableStreamDefaultReader<Uint8Array>;
    cancel?: () => Promise<void>;
  };
  if (stream.getReader) {
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      reader = stream.getReader();
      await reader.cancel();
    } catch {
      // Preserve the original HTTP error.
    } finally {
      try { reader?.releaseLock(); } catch { /* Already released. */ }
    }
    return;
  }
  try { await stream.cancel?.(); } catch { /* Preserve the original HTTP error. */ }
};

export class QuestionRecommendationError extends Error {
  constructor(
    message: string,
    public retryable: boolean,
    public statusCode?: number,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'QuestionRecommendationError';
  }
}

export const getQuestionRecommendation = async (
  request: QuestionRecommendationRequest,
  signal?: AbortSignal
): Promise<QuestionRecommendationSuccessResponse> => {
  try {
    const response = await api.post<QuestionRecommendationSuccessResponse>(
      '/api/v1/questions/chat',
      request,
      { signal, timeout: CHAT_REQUEST_TIMEOUT_MS }
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isCancel(error) || (error instanceof DOMException && error.name === 'AbortError')) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
      if (isTimeout) {
        throw new QuestionRecommendationError(
          '응답이 지연되고 있어요. 잠시 후 다시 시도해주세요.',
          true,
          status
        );
      }
      const message =
        error.response?.data?.message ||
        (status === 401
          ? '로그인 상태를 확인해주세요.'
          : '답변을 가져오지 못했어요. 잠시 후 다시 시도해주세요.');
      throw new QuestionRecommendationError(
        message,
        !status || status === 429 || status === 503 || status >= 500,
        status
      );
    }

    throw new QuestionRecommendationError('네트워크 연결을 확인한 뒤 다시 시도해주세요.', true);
  }
};

export const streamQuestionRecommendation = async (
  request: QuestionRecommendationRequest,
  handlers: {
    onStatus?: (stage: 'planning' | 'searching' | 'answering') => void;
    onCards?: (data: QuestionRecommendationData) => void;
  },
  signal?: AbortSignal
): Promise<QuestionRecommendationData> => {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), CHAT_REQUEST_TIMEOUT_MS);
  const requestSignal = signal ? AbortSignal.any([signal, timeoutController.signal]) : timeoutController.signal;
  try {
    const response = await api.post<ReadableStream<Uint8Array>>(
      '/api/v1/questions/chat/stream',
      request,
      {
        adapter: 'fetch',
        responseType: 'stream',
        signal: requestSignal,
        timeout: CHAT_REQUEST_TIMEOUT_MS,
        headers: { Accept: 'text/event-stream' },
      }
    );
    let finalData: QuestionRecommendationData | undefined;
    await consumeQuestionRecommendationStream(response.data, {
      ...handlers,
      onDone: (data) => { finalData = data; },
    });
    if (!finalData) throw new QuestionRecommendationError('답변이 완료되기 전에 연결이 종료됐어요. 다시 시도해주세요.', true);
    return finalData;
  } catch (error: unknown) {
    if (signal?.aborted) throw error;
    if (timeoutController.signal.aborted || (axios.isAxiosError(error) && ['ECONNABORTED', 'ETIMEDOUT'].includes(error.code ?? ''))) {
      throw new QuestionRecommendationError('응답이 지연되고 있어요. 잠시 후 다시 시도해주세요.', true, undefined, { cause: error });
    }
    if (error instanceof QuestionRecommendationError) throw error;
    if (axios.isAxiosError(error)) {
      await cancelResponseBody(error.response?.data);
      const status = error.response?.status;
      throw new QuestionRecommendationError(
        status === 401 ? '로그인 상태를 확인해주세요.' : '답변을 가져오지 못했어요. 잠시 후 다시 시도해주세요.',
        !status || status === 429 || status === 503 || status >= 500,
        status,
        { cause: error }
      );
    }
    if (error instanceof Error && 'retryable' in error) {
      throw new QuestionRecommendationError(error.message, error.retryable === true, undefined, { cause: error });
    }
    throw new QuestionRecommendationError(
      error instanceof Error ? error.message : '네트워크 연결을 확인한 뒤 다시 시도해주세요.',
      true,
      undefined,
      { cause: error }
    );
  } finally {
    clearTimeout(timeoutId);
  }
};
