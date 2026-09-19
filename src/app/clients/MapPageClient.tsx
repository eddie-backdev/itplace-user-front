'use client';

import dynamic from 'next/dynamic';
import RouteLoadingFallback from '@/components/RouteLoadingFallback';

const MapPageClient = dynamic(() => import('@/screens/MainPage'), {
  ssr: false,
  loading: () => <RouteLoadingFallback />,
});

export default MapPageClient;
