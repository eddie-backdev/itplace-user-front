import JsonLd from '@/components/JsonLd';
import { createPageStructuredData } from '@/lib/structuredData';
import MapPageClient from '../../clients/MapPageClient';
import { createPageMetadata } from '@/lib/metadata';

const pageMetadata = {
  title: '통신사 멤버십 혜택 지도 | 잇플레이스',
  description:
    'SKT, KT, LG U+ 멤버십 제휴처와 주변 혜택을 지도에서 검색하고 온라인·오프라인 이용 조건을 확인하세요.',
  path: '/map',
};

export const metadata = createPageMetadata(pageMetadata);

export default function MapPage() {
  return (
    <>
      <JsonLd data={createPageStructuredData(pageMetadata)} />
      <h1 className="sr-only">통신사 멤버십 혜택 지도</h1>
      <MapPageClient />
    </>
  );
}
