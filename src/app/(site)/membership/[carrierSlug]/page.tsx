import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import {
  CARRIER_PAGE_CONFIGS,
  getCarrierPageBySlug,
  MEMBERSHIP_INDEX_PAGE,
} from '@/config/membershipPages';
import MembershipLandingPage from '@/screens/MembershipLandingPage';
import { createPageMetadata } from '@/lib/metadata';
import { createCollectionPageStructuredData } from '@/lib/structuredData';
import { getPublicPartnerBenefits } from '@/server/userApi';

type CarrierPageProps = { params: Promise<{ carrierSlug: string }> };

export function generateStaticParams() {
  return CARRIER_PAGE_CONFIGS.map(({ slug }) => ({ carrierSlug: slug }));
}

export async function generateMetadata({ params }: CarrierPageProps): Promise<Metadata> {
  const { carrierSlug } = await params;
  const carrier = getCarrierPageBySlug(carrierSlug);
  if (!carrier) return {};
  return createPageMetadata({
    title: `${carrier.name} 멤버십 혜택·제휴처 | 잇플레이스`,
    description: carrier.summary,
    path: `/membership/${carrierSlug}`,
  });
}

export default async function CarrierMembershipPage({ params }: CarrierPageProps) {
  const { carrierSlug } = await params;
  const carrier = getCarrierPageBySlug(carrierSlug);
  if (!carrier) notFound();
  const initialData = await getPublicPartnerBenefits({ carrier: carrier.code, size: 8 });
  const path = `/membership/${carrier.slug}`;
  const structuredData = createCollectionPageStructuredData({
    name: `${carrier.name} 멤버십 혜택`,
    description: carrier.summary,
    path,
    parentName: MEMBERSHIP_INDEX_PAGE.heading,
    parentPath: MEMBERSHIP_INDEX_PAGE.path,
  });

  return (
    <>
      <JsonLd data={structuredData} />
      <MembershipLandingPage key={path} initialPartners={initialData?.content ?? null} />
    </>
  );
}
