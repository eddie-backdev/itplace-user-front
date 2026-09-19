import JsonLd from '@/components/JsonLd';
import { createPageStructuredData } from '@/lib/structuredData';
import ContactPage from '@/screens/ContactPage';
import { createPageMetadata } from '@/lib/metadata';

const pageMetadata = {
  title: '문의 | 잇플레이스',
  description:
    'ITPLACE 서비스 오류, 혜택 정보 수정, 제휴 문의, 개인정보 관련 문의 접수 방법을 안내합니다.',
  path: '/contact',
};

export const metadata = createPageMetadata(pageMetadata);

export default function Route() {
  return (
    <>
      <JsonLd data={createPageStructuredData(pageMetadata)} />
      <ContactPage />
    </>
  );
}
