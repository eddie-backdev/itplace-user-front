import AuthLayout from '../features/loginPage/layouts/AuthLayout';
import type { AuthPreviewPartner } from '@/features/loginPage/components/common/AuthBenefitsPreview';

const LoginPage = ({ previewPartners }: { previewPartners: AuthPreviewPartner[] }) => {
  return <AuthLayout previewPartners={previewPartners} />;
};

export default LoginPage;
