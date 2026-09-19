'use client';

import dynamic from 'next/dynamic';
import RouteLoadingFallback from '@/components/RouteLoadingFallback';

const NotFoundPageClient = dynamic(() => import('@/screens/NotFoundPage'), {
  loading: () => <RouteLoadingFallback />,
});

export default NotFoundPageClient;
