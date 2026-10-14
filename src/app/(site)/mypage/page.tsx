import { MyPageOverviewClient } from '../../clients/MyPageClients';

export const metadata = {
  title: '마이페이지 | 잇플레이스',
  robots: { index: false, follow: true },
  alternates: { canonical: null },
};

export default function MyPageOverviewRoute() {
  return <MyPageOverviewClient />;
}
