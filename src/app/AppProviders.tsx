'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { setupInterceptors } from '@/apis/interceptorSetup';
import ToastProvider from '@/components/ToastProvider';
import { refreshToken } from '@/features/loginPage/apis/auth';
import { store, persistor, type RootState } from '@/store';
import { logout } from '@/store/authSlice';
import KakaoMapScript from './KakaoMapScript';
import { BENEFIT_CHAT_ENABLED } from '@/config/features';
import { clearQuestionRecommendationChatStorage } from '@/features/questionRecommendationChat/utils/chatSessionStorage.mjs';
import { useClientReady } from '@/hooks/useClientReady';
import ReferenceDataProvider from '@/components/ReferenceDataProvider';
import type { ReferenceData } from '@/utils/referenceData';

// Descendant mount effects can issue API requests immediately. Configure the
// shared Axios instance before any of those descendants render.
setupInterceptors();

const QuestionRecommendationChatWidget = dynamic(
  () => import('@/features/questionRecommendationChat/components/QuestionRecommendationChatWidget'),
  { ssr: false }
);

function QuestionRecommendationLoader() {
  const { isLoggedIn, user } = useSelector((state: RootState) => state.auth);
  const isRehydrated = useSelector((state: RootState) => state._persist.rehydrated);
  const isClientReady = useClientReady();
  const previousAuth = useRef({ isRehydrated: false, isLoggedIn: false, user });

  useEffect(() => {
    const previous = previousAuth.current;
    if (previous.isRehydrated && previous.isLoggedIn) {
      if (!isLoggedIn || (isLoggedIn && previous.user !== user)) {
        clearQuestionRecommendationChatStorage();
      }
    }
    previousAuth.current = { isRehydrated, isLoggedIn, user };
  }, [isLoggedIn, isRehydrated, user]);

  if (!isClientReady || !isRehydrated) return null;

  return <QuestionRecommendationChatWidget />;
}

function AuthSessionValidator() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);

  useEffect(() => {
    if (!isLoggedIn) return;

    const timer = window.setTimeout(async () => {
      try {
        await refreshToken();
      } catch {
        dispatch(logout());
        await persistor.purge();
      }
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [dispatch, isLoggedIn]);

  return null;
}

export default function AppProviders({
  children,
  initialReferenceData,
}: {
  children: ReactNode;
  initialReferenceData: ReferenceData | null;
}) {
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <Provider store={store}>
      <ReferenceDataProvider initialData={initialReferenceData}>
        <AuthSessionValidator />
        <KakaoMapScript />
        {children}
        <ToastProvider />
        {BENEFIT_CHAT_ENABLED && <QuestionRecommendationLoader />}
      </ReferenceDataProvider>
    </Provider>
  );
}
