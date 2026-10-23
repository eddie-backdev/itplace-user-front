import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import PartnerBenefitPage from '@/screens/PartnerBenefitPage';
import { createPageMetadata, SITE_ORIGIN } from '@/lib/metadata';
import { getPublicPartnerBenefitDetailResult } from '@/server/userApi';
import { getBenefitMembershipFilter, getCarrierLabel } from '@/utils/membership';
import { getPublicReferenceData } from '@/server/userApi';
import {
  getCarrierBenefitDisplayName,
  getMembershipOptionLabel,
} from '@/features/allBenefitsPage/apis/allBenefitsApi';
import { createPartnerSlug } from '@/utils/partnerSeo';

type PartnerPageProps = {
  params: Promise<{ partnerId: string; partnerSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const readPartnerQuery = async (searchParams: PartnerPageProps['searchParams']) => {
  const query = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const referenceData = await getPublicReferenceData();
  return {
    membership: getBenefitMembershipFilter(first(query.carrier), first(query.grade), referenceData),
    membershipOnly: first(query.membership) === 'mine',
  };
};

const withMembershipQuery = (
  path: string,
  membership: ReturnType<typeof getBenefitMembershipFilter>,
  membershipOnly: boolean
) => {
  if (!membership) return encodeURI(path);
  const query = new URLSearchParams({ carrier: membership.carrier });
  if (membership.grade) query.set('grade', membership.grade);
  if (membershipOnly) query.set('membership', 'mine');
  return `${encodeURI(path)}?${query}`;
};

const decodeSlug = (slug: string) => {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
};

const labelFromSlug = (slug: string) => decodeSlug(slug).replace(/-/g, ' ').trim();

const getPartnerDescription = (
  partnerName: string,
  carrierGroups?: Array<{ carrier: Parameters<typeof getCarrierLabel>[0] }>
) => {
  const carrierNames = carrierGroups?.map(({ carrier }) => getCarrierLabel(carrier)) ?? [];
  return carrierNames.length > 0
    ? `${partnerName}에서 이용할 수 있는 ${carrierNames.join(', ')} 멤버십 혜택의 등급별 조건, 이용 방법과 제한 사항을 비교하세요.`
    : `${partnerName} 통신사 멤버십 혜택의 등급별 조건, 이용 방법과 제한 사항을 비교하세요.`;
};

export async function generateMetadata({
  params,
  searchParams,
}: PartnerPageProps): Promise<Metadata> {
  const { partnerId, partnerSlug } = await params;
  const numericPartnerId = Number(partnerId);
  const { membership, membershipOnly } = await readPartnerQuery(searchParams);
  const [result, comparisonResult] = await Promise.all([
    getPublicPartnerBenefitDetailResult(numericPartnerId, membership?.carrier, membership?.grade),
    getPublicPartnerBenefitDetailResult(numericPartnerId),
  ]);
  if (result.status === 'not-found' && comparisonResult.status === 'not-found') notFound();
  const detail = result.data;
  const comparisonDetail = comparisonResult.data;
  const canonicalDetail = detail ?? comparisonDetail;
  const partnerName = canonicalDetail?.partnerName ?? labelFromSlug(partnerSlug) ?? '제휴처';
  const canonicalSlug = canonicalDetail
    ? createPartnerSlug(canonicalDetail.partnerName)
    : partnerSlug;
  const canonicalId = Number.isInteger(numericPartnerId) ? String(numericPartnerId) : partnerId;

  if (canonicalDetail && (partnerId !== canonicalId || decodeSlug(partnerSlug) !== canonicalSlug)) {
    permanentRedirect(
      withMembershipQuery(
        `/benefits/partners/${canonicalId}/${canonicalSlug}`,
        membership,
        membershipOnly
      )
    );
  }

  return createPageMetadata({
    title: `${partnerName} 통신사 멤버십 혜택 | 잇플레이스`,
    description: getPartnerDescription(partnerName, comparisonResult.data?.carrierGroups),
    path: `/benefits/partners/${canonicalId}/${canonicalSlug}`,
    image: canonicalDetail?.image ?? undefined,
    noIndex: result.status !== 'success',
  });
}

export default async function PartnerBenefitRoute({ params, searchParams }: PartnerPageProps) {
  const { partnerId, partnerSlug } = await params;
  const numericPartnerId = Number(partnerId);
  const { membership, membershipOnly } = await readPartnerQuery(searchParams);
  if (!Number.isInteger(numericPartnerId) || numericPartnerId <= 0) notFound();

  const [result, comparisonResult] = await Promise.all([
    getPublicPartnerBenefitDetailResult(numericPartnerId, membership?.carrier, membership?.grade),
    getPublicPartnerBenefitDetailResult(numericPartnerId),
  ]);
  if (result.status === 'not-found' && comparisonResult.status === 'not-found') notFound();

  const detail = result.data;
  const comparisonDetail = comparisonResult.data;
  const canonicalDetail = detail ?? comparisonDetail;
  const partnerName = canonicalDetail?.partnerName ?? labelFromSlug(partnerSlug) ?? '제휴처';
  const canonicalSlug = canonicalDetail
    ? createPartnerSlug(canonicalDetail.partnerName)
    : partnerSlug;
  const canonicalPath = `/benefits/partners/${numericPartnerId}/${canonicalSlug}`;

  if (
    canonicalDetail &&
    (partnerId !== String(numericPartnerId) || decodeSlug(partnerSlug) !== canonicalSlug)
  ) {
    permanentRedirect(withMembershipQuery(canonicalPath, membership, membershipOnly));
  }
  const description = getPartnerDescription(
    partnerName,
    comparisonDetail?.carrierGroups ?? detail?.carrierGroups
  );
  const structuredBenefits =
    comparisonDetail?.carrierGroups.flatMap((group) =>
      group.benefits.map((benefit) => ({ benefit, carrier: group.carrier }))
    ) ?? [];
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${partnerName} 통신사 멤버십 혜택`,
    description,
    url: `${SITE_ORIGIN}${canonicalPath}`,
    isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: `${SITE_ORIGIN}/` },
        {
          '@type': 'ListItem',
          position: 2,
          name: '전체 멤버십 혜택',
          item: `${SITE_ORIGIN}/benefits`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: partnerName,
          item: `${SITE_ORIGIN}${canonicalPath}`,
        },
      ],
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: structuredBenefits.length,
      itemListElement: structuredBenefits.map(({ benefit, carrier }, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Thing',
          name: `${getCarrierLabel(carrier)} ${getCarrierBenefitDisplayName(benefit)}${getMembershipOptionLabel(benefit) ? ` · ${getMembershipOptionLabel(benefit)}` : ''}`,
          description: benefit.description || benefit.tierBenefits[0]?.context || undefined,
          url: `${SITE_ORIGIN}${canonicalPath}#benefit-${benefit.benefitId}`,
        },
      })),
    },
  };

  return (
    <>
      {detail ? <JsonLd data={structuredData} /> : null}
      <PartnerBenefitPage
        key={`${numericPartnerId}:${membership?.carrier ?? ''}:${membership?.grade ?? ''}`}
        initialDetail={detail}
        comparisonDetail={comparisonDetail}
        membership={membership}
        membershipOnly={membershipOnly}
      />
    </>
  );
}
