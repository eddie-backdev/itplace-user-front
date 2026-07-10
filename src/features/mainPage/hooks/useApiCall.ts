import { useState, useCallback, useRef } from 'react';

/**
 * API 호출 공통 상태 관리 훅
 * 로딩, 에러, 데이터 상태를 통합 관리하여 중복 코드 제거
 */
interface UseApiCallReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  execute: (apiCall: () => Promise<T>) => Promise<void>;
  setData: (data: T | null) => void;
  clearError: () => void;
}

export const useApiCall = <T = unknown>(initialData: T | null = null): UseApiCallReturn<T> => {
  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSeqRef = useRef(0);

  // API 호출 실행 함수
  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      if (requestSeqRef.current === requestSeq) {
        setData(result);
      }
    } catch (err) {
      const isCanceledRequest =
        err instanceof Error &&
        (err.name === 'AbortError' || err.name === 'CanceledError' || err.message === 'canceled');

      if (requestSeqRef.current === requestSeq && !isCanceledRequest) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      if (requestSeqRef.current === requestSeq) {
        setIsLoading(false);
      }
    }
  }, []);

  // 에러 상태 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    isLoading,
    error,
    execute,
    setData,
    clearError,
  };
};
