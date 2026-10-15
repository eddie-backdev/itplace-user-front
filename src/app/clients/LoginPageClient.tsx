'use client';

import PublicRoute from '@/features/loginPage/layouts/PublicRoute';
import LoginPage from '@/screens/LoginPage';
import type { AuthPreviewPartner } from '@/features/loginPage/components/common/AuthBenefitsPreview';

export default function LoginPageClient({ previewPartners }: { previewPartners: AuthPreviewPartner[] }) {
  return (
    <PublicRoute>
      <LoginPage previewPartners={previewPartners} />
    </PublicRoute>
  );
}
