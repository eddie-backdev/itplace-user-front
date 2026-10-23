'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import api from '@/apis/axiosInstance';
import type { ReferenceData, ReferenceDataState } from '@/utils/referenceData';

const ReferenceDataContext = createContext<ReferenceDataState | null>(null);

export default function ReferenceDataProvider({ children, initialData = null }: { children: ReactNode; initialData?: ReferenceData | null }) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    api.get('/api/v1/reference-data').then(({ data: envelope }) => {
      if (!cancelled && envelope?.data?.grades && envelope?.data?.categories && envelope?.data?.programs && envelope?.data?.gradeMatches) {
        setData(envelope.data as ReferenceData);
        setError(false);
      } else if (!cancelled) setError(true);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [attempt]);

  return <ReferenceDataContext.Provider value={{ data, error, retry }}>{error ? <div role="alert" className="px-4 py-2 text-sm text-red-700">참조 코드 정보를 불러오지 못했습니다. <button type="button" onClick={retry} className="underline">다시 시도</button></div> : null}{children}</ReferenceDataContext.Provider>;
}

export const useReferenceData = () => {
  const value = useContext(ReferenceDataContext);
  if (!value) throw new Error('ReferenceDataProvider is missing');
  return value;
};
