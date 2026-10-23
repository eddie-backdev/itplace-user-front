import JsonLd from '@/components/JsonLd';
import { createPageStructuredData } from '@/lib/structuredData';
import AllBenefitsPage from '@/screens/AllBenefitsPage';
import { createPageMetadata } from '@/lib/metadata';
import { getPublicPartnerBenefits, getPublicReferenceData } from '@/server/userApi';
import { getBenefitMembershipFilter, isCarrierCode } from '@/utils/membership';
import { toCategoryOptions } from '@/utils/referenceData';
import { getBenefitsSeoPolicy } from '@/utils/benefitsSeo.mjs';

const pageMetadata = {
  title: '전체 통신사 멤버십 혜택 | 잇플레이스',
  description:
    'SKT, KT, LG U+ 통신사 멤버십 제휴 혜택을 브랜드, 카테고리, 통신사별로 검색하고 비교하세요.',
};

type BenefitsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: BenefitsPageProps) {
  const { canonicalPath, noIndex } = getBenefitsSeoPolicy(await searchParams);
  return createPageMetadata({ ...pageMetadata, path: canonicalPath, noIndex });
}

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function BenefitsPage({ searchParams }: BenefitsPageProps) {
  const referenceData = await getPublicReferenceData();
  const query = await searchParams;
  const { canonicalPath } = getBenefitsSeoPolicy(query);
  const keyword = firstValue(query.q)?.trim().slice(0, 100);
  const carrierValue = firstValue(query.carrier)?.trim();
  const carrier = isCarrierCode(carrierValue) ? carrierValue : undefined;
  const gradeValue = firstValue(query.grade)?.trim();
  const grade = getBenefitMembershipFilter(carrier, gradeValue, referenceData)?.grade;
  const categoryValue = firstValue(query.category)?.trim();
  const category = toCategoryOptions(referenceData).some((item) => item.id === categoryValue && item.id !== '전체')
    ? categoryValue
    : undefined;
  const pageValue = Number(firstValue(query.page) ?? 1);
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue - 1 : 0;
  // The saved membership belongs to the browser session and is restored on the client.
  const membershipOnly = firstValue(query.membership) === 'mine';
  const invalidGradeFilter = Boolean(gradeValue && !grade);
  const initialData = membershipOnly || invalidGradeFilter
    ? null
    : await getPublicPartnerBenefits({ keyword, carrier, grade, category, page });
  const initialRequestKey = [
    keyword ?? '',
    carrier ?? '',
    category ?? '전체',
    page + 1,
    grade ?? '',
  ].join('|');
  const routeKey = `${keyword ?? ''}|${carrier ?? ''}|${grade ?? ''}|${category ?? ''}|${page}|${membershipOnly}`;

  return (
    <>
      <JsonLd
        data={createPageStructuredData({
          ...pageMetadata,
          path: canonicalPath,
          pageType: 'CollectionPage',
        })}
      />
      <AllBenefitsPage
        key={routeKey}
        initialData={initialData}
        initialRequestKey={initialRequestKey}
      />
    </>
  );
}
