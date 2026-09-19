import JsonLd from '@/components/JsonLd';
import { createPageStructuredData } from '@/lib/structuredData';
import TermsPage from '@/screens/TermsPage';
import { createPageMetadata } from '@/lib/metadata';

const pageMetadata = {
  title: '이용약관 | 잇플레이스',
  description:
    'ITPLACE 통신사 멤버십 혜택 검색 서비스의 이용 조건, 혜택 정보 안내 기준, 계정 및 문의 절차를 안내합니다.',
  path: '/terms',
};

export const metadata = createPageMetadata(pageMetadata);

export default function Route() {
  return (
    <>
      <JsonLd data={createPageStructuredData(pageMetadata)} />
      <TermsPage />
    </>
  );
}
