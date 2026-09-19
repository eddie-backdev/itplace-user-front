import JsonLd from '@/components/JsonLd';
import { createPageStructuredData } from '@/lib/structuredData';
import { Suspense } from 'react';
import AllBenefitsPage from '@/screens/AllBenefitsPage';
import { createPageMetadata } from '@/lib/metadata';
import RouteLoadingFallback from '@/components/RouteLoadingFallback';
import { getPublicPartnerBenefits } from '@/server/userApi';
import { isCarrierCode } from '@/utils/membership';

const pageMetadata = {
  title: '전체 통신사 멤버십 혜택 | 잇플레이스',
  description:
    'SKT, KT, LG U+ 통신사 멤버십 제휴 혜택을 브랜드, 카테고리, 통신사별로 검색하고 비교하세요.',
  path: '/benefits',
};

export const metadata = createPageMetadata(pageMetadata);

type BenefitsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function BenefitsPage({ searchParams }: BenefitsPageProps) {
  return (
    <>
      <JsonLd data={createPageStructuredData({ ...pageMetadata, pageType: 'CollectionPage' })} />
      <Suspense fallback={<RouteLoadingFallback />}>
        <BenefitsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function BenefitsContent({ searchParams }: BenefitsPageProps) {
  const query = await searchParams;
  const keyword = firstValue(query.q)?.trim().slice(0, 100);
  const carrierValue = firstValue(query.carrier)?.trim();
  const carrier = isCarrierCode(carrierValue) ? carrierValue : undefined;
  // The saved membership belongs to the browser session and is restored on the client.
  const membershipOnly = firstValue(query.membership) === 'mine';
  const initialData = membershipOnly ? null : await getPublicPartnerBenefits({ keyword, carrier });
  const routeKey = `${keyword ?? ''}|${carrier ?? ''}`;

  return <AllBenefitsPage key={routeKey} initialData={initialData} />;
}
