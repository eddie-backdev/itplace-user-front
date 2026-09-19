import LoginPageClient from '../../clients/LoginPageClient';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: '로그인 | 잇플레이스',
  description: '잇플레이스에 로그인해 회원 정보와 관심 혜택을 관리하세요.',
  path: '/login',
  noIndex: true,
});

export default function LoginPage() {
  return <LoginPageClient />;
}
