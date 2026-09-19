import type { MetadataRoute } from 'next';
import partnerCatalog from '@/data/partner-catalog.json';
import { SITE_ORIGIN } from '@/lib/metadata';
import { getPublicPartnerBenefits } from '@/server/userApi';
import { getPartnerBenefitPath } from '@/utils/partnerSeo';

const staticPaths = [
  '/',
  '/map',
  '/benefits',
  '/membership',
  '/membership/skt',
  '/membership/kt',
  '/membership/lguplus',
  '/about',
  '/guide',
  '/faq',
  '/contact',
  '/terms',
  '/privacy',
  '/account-deletion',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const partnersById = new Map<number, { partnerId: number; partnerName: string }>();
  const pageSize = 200;
  let page = 0;
  let totalPages = 1;
  let liveCatalogComplete = true;

  while (page < totalPages && page < 100) {
    const partnerData = await getPublicPartnerBenefits({ page, size: pageSize });
    if (!partnerData) {
      liveCatalogComplete = false;
      break;
    }
    partnerData.content.forEach((partner) => partnersById.set(partner.partnerId, partner));
    totalPages = Math.max(1, partnerData.totalPages);
    page += 1;
  }

  if (page < totalPages) {
    liveCatalogComplete = false;
  }

  if (!liveCatalogComplete) {
    partnersById.clear();
    partnerCatalog.partners.forEach((partner) =>
      partnersById.set(partner.partnerId, {
        partnerId: partner.partnerId,
        partnerName: partner.partnerName,
      })
    );
  }

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${SITE_ORIGIN}${path}`,
    changeFrequency: path === '/' || path === '/benefits' ? 'daily' : 'monthly',
    priority: path === '/' ? 1 : path === '/benefits' || path === '/map' ? 0.9 : 0.7,
  }));
  const partnerEntries: MetadataRoute.Sitemap = [...partnersById.values()].map((partner) => ({
    url: `${SITE_ORIGIN}${getPartnerBenefitPath(partner.partnerId, partner.partnerName)}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticEntries, ...partnerEntries];
}
