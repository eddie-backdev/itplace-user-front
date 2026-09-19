import JsonLd from '@/components/JsonLd';
import { createPageStructuredData } from '@/lib/structuredData';
import FaqPage from '@/screens/FaqPage';
import { createPageMetadata } from '@/lib/metadata';

const pageMetadata = {
  title: '자주 묻는 질문 | 잇플레이스',
  description:
    'ITPLACE 통신사 멤버십 혜택 검색, 온라인·오프라인 혜택 구분, 지도 검색, 문의 방법에 대한 자주 묻는 질문입니다.',
  path: '/faq',
};

export const metadata = createPageMetadata(pageMetadata);

export default function Route() {
  return (
    <>
      <JsonLd data={createPageStructuredData(pageMetadata)} />
      <FaqPage />
    </>
  );
}
