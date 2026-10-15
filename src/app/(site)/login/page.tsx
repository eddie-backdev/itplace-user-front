import LoginPageClient from '../../clients/LoginPageClient';
import { connection } from 'next/server';
import { createPageMetadata } from '@/lib/metadata';
import partnerCatalog from '@/data/partner-catalog.json';
import { getPartnerBenefitPath } from '@/utils/partnerSeo';
import type { AuthPreviewPartner } from '@/features/loginPage/components/common/AuthBenefitsPreview';

export const metadata = createPageMetadata({
  title: '로그인 | 잇플레이스',
  description: '잇플레이스에 로그인해 회원 정보와 관심 혜택을 관리하세요.',
  path: '/login',
  noIndex: true,
});

const featuredPartnerNames = ['GS25', '파리바게뜨', 'CGV'];

export default async function LoginPage() {
  await connection();

  const partners = partnerCatalog.partners;
  const previewPartners = featuredPartnerNames
    .map((name) => partners.find((partner) => partner.partnerName === name))
    .filter((partner): partner is (typeof partners)[number] => Boolean(partner))
    .concat(
      partners.filter((partner) => !featuredPartnerNames.includes(partner.partnerName)).slice(0, 3)
    )
    .slice(0, 3)
    .map(({ partnerId, partnerName, category, image, carriers }) => ({
      partnerId,
      partnerName,
      category: category ?? '제휴 혜택',
      image,
      carriers,
      href: getPartnerBenefitPath(partnerId, partnerName),
    })) satisfies AuthPreviewPartner[];

  return <LoginPageClient previewPartners={previewPartners} />;
}
