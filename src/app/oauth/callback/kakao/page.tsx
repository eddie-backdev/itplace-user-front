import OAuthCallbackPageClient from '../../../clients/OAuthCallbackPageClient';

export const metadata = {
  title: '카카오 로그인 처리 | 잇플레이스',
  robots: { index: false, follow: true },
  alternates: { canonical: null },
};

export default function OAuthCallbackPage() {
  return <OAuthCallbackPageClient />;
}
