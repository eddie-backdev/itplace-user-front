'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { setupInterceptors } from '@/apis/interceptorSetup';
import ToastProvider from '@/components/ToastProvider';
import { refreshToken } from '@/features/loginPage/apis/auth';
import { store, persistor, type RootState } from '@/store';
import { logout } from '@/store/authSlice';
import KakaoMapScript from './KakaoMapScript';
import { AI_RECOMMENDATION_ENABLED } from '@/config/features';

// Descendant mount effects can issue API requests immediately. Configure the
// shared Axios instance before any of those descendants render.
setupInterceptors();

const QuestionRecommendationChatWidget = dynamic(
  () => import('@/features/questionRecommendationChat/components/QuestionRecommendationChatWidget'),
  { ssr: false }
);

function QuestionRecommendationLoader() {
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const isRehydrated = useSelector((state: RootState) => state._persist.rehydrated);

  if (!isRehydrated || !isLoggedIn) return null;

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

export default function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <Provider store={store}>
      <AuthSessionValidator />
      <KakaoMapScript />
      {children}
      <ToastProvider />
      {AI_RECOMMENDATION_ENABLED && <QuestionRecommendationLoader />}
    </Provider>
  );
}
