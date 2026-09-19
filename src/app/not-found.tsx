import type { Metadata } from 'next';
import NotFoundPageClient from './clients/NotFoundPageClient';

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없습니다 | 잇플레이스',
  description:
    '요청한 ITPLACE 페이지를 찾을 수 없습니다. 메인 페이지에서 통신사 멤버십 혜택을 다시 검색해 주세요.',
  robots: { index: false, follow: true },
  alternates: { canonical: null },
};

export default function NotFound() {
  return <NotFoundPageClient />;
}
