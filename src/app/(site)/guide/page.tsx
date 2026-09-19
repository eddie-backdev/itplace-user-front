import JsonLd from '@/components/JsonLd';
import { createPageStructuredData } from '@/lib/structuredData';
import MembershipGuidePage from '@/screens/MembershipGuidePage';
import { createPageMetadata } from '@/lib/metadata';

const pageMetadata = {
  title: '통신사 멤버십 혜택 이용 가이드 | 잇플레이스',
  description:
    'SKT, KT, LG U+ 멤버십 혜택을 지도에서 찾고 온라인·오프라인 이용 조건을 확인하는 방법을 안내합니다.',
  path: '/guide',
};

export const metadata = createPageMetadata(pageMetadata);

export default function Route() {
  return (
    <>
      <JsonLd data={createPageStructuredData(pageMetadata)} />
      <MembershipGuidePage />
    </>
  );
}
