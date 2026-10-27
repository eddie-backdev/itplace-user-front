import type { MetadataRoute } from 'next';
import partnerCatalog from '@/data/partner-catalog.json';
import { SITE_ORIGIN } from '@/lib/metadata';
import { getPublicPartnerBenefits } from '@/server/userApi';
import { getNearbyStorePreviewBatch } from '@/server/storeApi';
import { getPartnerBenefitPath } from '@/utils/partnerSeo';
import { getStorePath } from '@/utils/storeSeo';
import { storeRegions } from '@/data/storeRegions';

const staticPaths = [
  '/',
  '/map',
  '/places',
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
  const regionalBatchesPromise = Promise.all(storeRegions.map((region) =>
    getNearbyStorePreviewBatch(region.latitude, region.longitude, region.radiusMeters)
  ));
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

  const staticEntries: MetadataRoute.Sitemap = [...staticPaths, ...storeRegions.map((region) => `/places/${region.slug}`)].map((path) => ({
    url: `${SITE_ORIGIN}${path}`,
    changeFrequency: path === '/' || path === '/benefits' ? 'daily' : 'monthly',
    priority: path === '/' ? 1 : path === '/benefits' || path === '/map' ? 0.9 : 0.7,
  }));
  const partnerEntries: MetadataRoute.Sitemap = [...partnersById.values()].map((partner) => ({
    url: `${SITE_ORIGIN}${getPartnerBenefitPath(partner.partnerId, partner.partnerName)}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const regionalBatches = await regionalBatchesPromise;
  const storesById = new Map<number, { storeId: number; storeName: string }>();
  regionalBatches.forEach((result) => {
    if (result.status !== 'success') return;
    result.data.stores.slice(0, 20).forEach((store) => {
      const address = store.roadAddress?.trim() || store.address?.trim();
      if (!Number.isSafeInteger(store.storeId) || store.storeId <= 0 || !store.storeName.trim()
        || !Number.isFinite(store.latitude) || Math.abs(store.latitude) > 90
        || !Number.isFinite(store.longitude) || Math.abs(store.longitude) > 180 || !address) return;
      storesById.set(store.storeId, { storeId: store.storeId, storeName: store.storeName.trim() });
    });
  });
  const storeEntries: MetadataRoute.Sitemap = [...storesById.values()].map((store) => ({
    url: `${SITE_ORIGIN}${getStorePath(store.storeId, store.storeName)}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...partnerEntries, ...storeEntries];
}
