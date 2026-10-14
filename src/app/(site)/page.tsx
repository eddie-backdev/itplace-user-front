import JsonLd from '@/components/JsonLd';
import { createPageStructuredData } from '@/lib/structuredData';
import BenefitHomePage from '@/screens/BenefitHomePage';
import { createPageMetadata } from '@/lib/metadata';
import { getPublicPartnerBenefits } from '@/server/userApi';
import { CARRIER_OPTIONS, isCarrierCode } from '@/utils/membership';

const pageMetadata = {
  title: '결제 전 확인하는 통신사 멤버십 혜택 | 잇플레이스',
  description:
    'SKT, KT, LG U+ 멤버십 혜택을 한곳에서 비교하세요. 할인과 적립의 차이, 이용 조건과 결제 전 확인할 내용을 읽고 주변 제휴처를 찾아보세요.',
  path: '/',
};

export const metadata = createPageMetadata(pageMetadata);

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ carrier?: string | string[] }>;
}) {
  const [query, sections] = await Promise.all([
    searchParams,
    Promise.all(
      CARRIER_OPTIONS.map(async ({ code }) => {
        const data = await getPublicPartnerBenefits({ carrier: code, size: 3 });
        return { carrier: code, partners: data?.content ?? null };
      })
    ),
  ]);
  const selectedCarrier =
    typeof query.carrier === 'string' && isCarrierCode(query.carrier) ? query.carrier : 'SKT';

  return (
    <>
      <JsonLd data={createPageStructuredData(pageMetadata)} />
      <BenefitHomePage sections={sections} selectedCarrier={selectedCarrier} />
    </>
  );
}
