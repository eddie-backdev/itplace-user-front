'use client';

import dynamic from 'next/dynamic';
import RouteLoadingFallback from '@/components/RouteLoadingFallback';

const OAuthCallbackPageClient = dynamic(
  () => import('@/features/loginPage/layouts/OAuthRedirectHandler'),
  { ssr: false, loading: () => <RouteLoadingFallback /> }
);

export default OAuthCallbackPageClient;
