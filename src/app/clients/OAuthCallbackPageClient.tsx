'use client';

import dynamic from 'next/dynamic';
import RouteLoadingFallback from '@/components/RouteLoadingFallback';

const OAuthCallbackPageClient = dynamic(
  () => import('@/features/loginPage/layouts/OAuthRedirectHandler'),
  { ssr: false, loading: () => <RouteLoadingFallback>카카오 로그인 결과를 확인하고 있어요…</RouteLoadingFallback> }
);

export default OAuthCallbackPageClient;
