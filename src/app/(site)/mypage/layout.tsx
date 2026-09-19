import type { ReactNode } from 'react';
import { MyPageShell } from '../../clients/MyPageClients';

export const metadata = {
  title: '마이페이지 | 잇플레이스',
  robots: { index: false, follow: true },
  alternates: { canonical: null },
};

export default function MyPageLayout({ children }: { children: ReactNode }) {
  return <MyPageShell>{children}</MyPageShell>;
}
