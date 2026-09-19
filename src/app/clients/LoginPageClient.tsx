'use client';

import dynamic from 'next/dynamic';
import RouteLoadingFallback from '@/components/RouteLoadingFallback';
import PublicRoute from '@/features/loginPage/layouts/PublicRoute';
import AuthPersistenceGate from './AuthPersistenceGate';

const LoginPage = dynamic(() => import('@/screens/LoginPage'), {
  ssr: false,
  loading: () => <RouteLoadingFallback />,
});

export default function LoginPageClient() {
  return (
    <AuthPersistenceGate>
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    </AuthPersistenceGate>
  );
}
