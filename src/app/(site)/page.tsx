import JsonLd from '@/components/JsonLd';
import { createPageStructuredData } from '@/lib/structuredData';
import BenefitHomePage from '@/screens/BenefitHomePage';
import { createPageMetadata } from '@/lib/metadata';
import { getPublicPartnerBenefits, getPublicReferenceData } from '@/server/userApi';
import { CARRIER_OPTIONS, getBenefitMembershipGradeOptions, getBenefitMembershipFilter, isCarrierCode } from '@/utils/membership';
import { toCategoryOptions } from '@/utils/referenceData';

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

export default async function HomePage({ searchParams }: HomePageProps) {
  const referenceData = await getPublicReferenceData();
  const query = await searchParams;
  const carrierValue = firstValue(query.carrier);
  const selectedCarrier = isCarrierCode(carrierValue) ? carrierValue : 'SKT';
  const gradeValue = firstValue(query.grade);
  const selectedGrade = getBenefitMembershipFilter(selectedCarrier, gradeValue, referenceData)?.grade
    ?? getBenefitMembershipGradeOptions(selectedCarrier, referenceData)[0]?.code ?? '';
  const requestedCategory = firstValue(query.category);
  const category = toCategoryOptions(referenceData).some(({ id }) => id === requestedCategory && id !== '전체')
    ? requestedCategory
    : undefined;
  const sections = await Promise.all(
    CARRIER_OPTIONS.map(async ({ code }) => {
      const grade = code === selectedCarrier ? selectedGrade : getBenefitMembershipGradeOptions(code, referenceData)[0]?.code ?? '';
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
