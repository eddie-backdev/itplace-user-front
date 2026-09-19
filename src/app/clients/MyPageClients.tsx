'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import RouteLoadingFallback from '@/components/RouteLoadingFallback';
import MyPageLayout from '@/layouts/MyPageLayout';
import AuthPersistenceGate from './AuthPersistenceGate';

const loading = () => <RouteLoadingFallback />;

export const MyInfoPageClient = dynamic(() => import('@/screens/myPage/MyInfoPage'), {
  ssr: false,
  loading,
});

export const MyFavoritesPageClient = dynamic(() => import('@/screens/myPage/MyFavoritesPage'), {
  ssr: false,
  loading,
});

export function MyPageShell({ children }: { children: ReactNode }) {
  return (
    <AuthPersistenceGate>
      <MyPageLayout>{children}</MyPageLayout>
    </AuthPersistenceGate>
  );
}
