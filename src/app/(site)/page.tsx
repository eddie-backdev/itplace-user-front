import JsonLd from '@/components/JsonLd';
import { createPageStructuredData } from '@/lib/structuredData';
import HomePageClient from '../clients/HomePageClient';
import { createPageMetadata } from '@/lib/metadata';
import { getPublicPartnerBenefits } from '@/server/userApi';

const pageMetadata = {
  title: '통신 3사 멤버십 혜택 비교·검색 | 잇플레이스',
  description:
    '잇플레이스(ITPLACE, 잇플)에서 SKT, KT, LG U+ 통신 3사 멤버십 제휴처와 혜택을 지도와 목록으로 검색하고 비교하세요.',
  path: '/',
};

export const metadata = createPageMetadata(pageMetadata);

export default async function HomePage() {
  const initialData = await getPublicPartnerBenefits({ size: 8 });
  return (
    <>
      <JsonLd data={createPageStructuredData(pageMetadata)} />
      <HomePageClient initialPartners={initialData?.content ?? null} />
    </>
  );
}
