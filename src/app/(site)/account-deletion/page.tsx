import JsonLd from '@/components/JsonLd';
import { createPageStructuredData } from '@/lib/structuredData';
import AccountDeletionPage from '@/screens/AccountDeletionPage';
import { createPageMetadata } from '@/lib/metadata';

const pageMetadata = {
  title: '계정 및 데이터 삭제 안내 | 잇플레이스',
  description:
    'ITPLACE 계정 삭제 요청 방법, 삭제되는 데이터, 보관될 수 있는 데이터와 처리 절차를 안내합니다.',
  path: '/account-deletion',
};

export const metadata = createPageMetadata(pageMetadata);

export default function Route() {
  return (
    <>
      <JsonLd data={createPageStructuredData(pageMetadata)} />
      <AccountDeletionPage />
    </>
  );
}
