'use client';

import dynamic from 'next/dynamic';
import RouteLoadingFallback from '@/components/RouteLoadingFallback';

const MapPageClient = dynamic(() => import('@/screens/MainPage'), {
  ssr: false,
  loading: () => <RouteLoadingFallback>주변 매장 지도를 준비하고 있어요…</RouteLoadingFallback>,
});

export default MapPageClient;
