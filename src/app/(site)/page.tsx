import JsonLd from '@/components/JsonLd';
import { createPageStructuredData } from '@/lib/structuredData';
import BenefitHomePage from '@/screens/BenefitHomePage';
import { createPageMetadata } from '@/lib/metadata';
import { getPublicPartnerBenefits } from '@/server/userApi';
import { CARRIER_OPTIONS, isCarrierCode, isValidCarrierGradePair } from '@/utils/membership';
import { CATEGORIES } from '@/features/mainPage/constants';

const pageMetadata = {
  title: '통신 3사 멤버십 혜택 비교·검색 | 잇플레이스',
  description: 'SKT, KT, LG U+ 멤버십 제휴처와 혜택을 검색하고, 이용 조건을 확인해 보세요.',
  path: '/',
};

export const metadata = createPageMetadata(pageMetadata);

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const defaultGrade: Record<string, string> = {
  SKT: 'SKT_VIP',
  KT: 'KT_VIP',
  LGU: 'VIP',
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const query = await searchParams;
  const carrierValue = firstValue(query.carrier);
  const selectedCarrier = isCarrierCode(carrierValue) ? carrierValue : 'SKT';
  const gradeValue = firstValue(query.grade);
  const selectedGrade = isValidCarrierGradePair(selectedCarrier, gradeValue)
    ? gradeValue!
    : defaultGrade[selectedCarrier];
  const requestedCategory = firstValue(query.category);
  const category = CATEGORIES.some(({ id }) => id === requestedCategory && id !== '전체')
    ? requestedCategory
    : undefined;
  const sections = await Promise.all(
    CARRIER_OPTIONS.map(async ({ code }) => {
      const grade = code === selectedCarrier ? selectedGrade : defaultGrade[code];
      const data = await getPublicPartnerBenefits({ carrier: code, grade, category, size: 12 });
      return { carrier: code, partners: data?.content ?? null };
    })
  );

  return (
    <>
      <JsonLd data={createPageStructuredData(pageMetadata)} />
      <BenefitHomePage
        sections={sections}
        selectedCarrier={selectedCarrier}
        selectedGrade={selectedGrade}
      />
    </>
  );
}
