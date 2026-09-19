import MembershipLandingPage from '@/screens/MembershipLandingPage';
import JsonLd from '@/components/JsonLd';
import { MEMBERSHIP_INDEX_PAGE } from '@/config/membershipPages';
import { createPageMetadata } from '@/lib/metadata';
import { createCollectionPageStructuredData } from '@/lib/structuredData';
import { getPublicPartnerBenefits } from '@/server/userApi';

export const metadata = createPageMetadata({
  title: MEMBERSHIP_INDEX_PAGE.title,
  description: MEMBERSHIP_INDEX_PAGE.description,
  path: MEMBERSHIP_INDEX_PAGE.path,
});

export default async function MembershipPage() {
  const initialData = await getPublicPartnerBenefits({ size: 12 });
  const structuredData = createCollectionPageStructuredData({
    name: MEMBERSHIP_INDEX_PAGE.heading,
    description: MEMBERSHIP_INDEX_PAGE.description,
    path: MEMBERSHIP_INDEX_PAGE.path,
  });

  return (
    <>
      <JsonLd data={structuredData} />
      <MembershipLandingPage
        key={MEMBERSHIP_INDEX_PAGE.path}
        initialPartners={initialData?.content ?? null}
      />
    </>
  );
}
