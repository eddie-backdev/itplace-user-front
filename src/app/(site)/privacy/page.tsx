import JsonLd from '@/components/JsonLd';
import { createPageStructuredData } from '@/lib/structuredData';
import PrivacyPolicyPage from '@/screens/PrivacyPolicyPage';
import { createPageMetadata } from '@/lib/metadata';

const pageMetadata = {
  title: '개인정보처리방침 | 잇플레이스',
  description:
    'ITPLACE 웹 및 모바일 서비스의 개인정보 수집, 이용 목적, 위치정보 처리, 보관 및 파기, 이용자 권리를 안내합니다.',
  path: '/privacy',
};

export const metadata = createPageMetadata(pageMetadata);

export default function Route() {
  return (
    <>
      <JsonLd data={createPageStructuredData(pageMetadata)} />
      <PrivacyPolicyPage />
    </>
  );
}
