'use client';

import dynamic from 'next/dynamic';
import RouteLoadingFallback from '@/components/RouteLoadingFallback';
import PublicRoute from '@/features/loginPage/layouts/PublicRoute';
import AuthPersistenceGate from './AuthPersistenceGate';
import type { AuthPreviewPartner } from '@/features/loginPage/components/common/AuthBenefitsPreview';

const LoginPage = dynamic(() => import('@/screens/LoginPage'), {
  ssr: false,
  loading: () => <RouteLoadingFallback />,
});

export default function LoginPageClient({ previewPartners }: { previewPartners: AuthPreviewPartner[] }) {
  return (
    <AuthPersistenceGate>
      <PublicRoute>
        <LoginPage previewPartners={previewPartners} />
      </PublicRoute>
    </AuthPersistenceGate>
  );
}
