import JsonLd from '@/components/JsonLd';
import { createPageStructuredData } from '@/lib/structuredData';
import AboutPage from '@/screens/AboutPage';
import { createPageMetadata } from '@/lib/metadata';

const pageMetadata = {
  title: '서비스 소개 | 잇플레이스',
  description:
    '잇플레이스(ITPLACE, 잇플)는 SKT, KT, LG U+ 통신사 멤버십 혜택과 제휴처를 지도 기반으로 찾을 수 있는 혜택 검색 서비스입니다.',
  path: '/about',
};

export const metadata = createPageMetadata(pageMetadata);

export default function Route() {
  return (
    <>
      <JsonLd data={createPageStructuredData(pageMetadata)} />
      <AboutPage />
    </>
  );
}
