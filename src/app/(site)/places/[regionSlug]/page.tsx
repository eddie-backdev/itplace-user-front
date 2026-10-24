import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import { getStoreRegion } from '@/data/storeRegions';
import { createPageMetadata, SITE_ORIGIN } from '@/lib/metadata';
import { getNearbyStorePreviewBatch } from '@/server/storeApi';
import { getPublicReferenceData } from '@/server/userApi';
import { getCategoryLabel } from '@/utils/referenceData';
import { getCarrierLabel, isCarrierCode } from '@/utils/membership';
import { getStorePath } from '@/utils/storeSeo';

type Props = { params: Promise<{ regionSlug: string }> };

const distanceFromRegionKm = (region: { latitude: number; longitude: number }, store: { latitude: number; longitude: number }) => {
  if (![region.latitude, region.longitude, store.latitude, store.longitude].every(Number.isFinite)
    || Math.abs(region.latitude) > 90 || Math.abs(store.latitude) > 90
    || Math.abs(region.longitude) > 180 || Math.abs(store.longitude) > 180) return null;
  const radians = Math.PI / 180;
  const latitudeDelta = (store.latitude - region.latitude) * radians;
  const longitudeDelta = (store.longitude - region.longitude) * radians;
  const startLatitude = region.latitude * radians;
  const endLatitude = store.latitude * radians;
  const haversine = Math.min(1, Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2);
  return (2 * 6371 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))).toFixed(1);
};

export const dynamic = 'force-dynamic';

const loadRegion = async (params: Props['params']) => {
  const { regionSlug } = await params;
  const region = getStoreRegion(regionSlug);
  if (!region) notFound();
  const result = await getNearbyStorePreviewBatch(region.latitude, region.longitude, region.radiusMeters);
  if (result.status === 'unavailable') throw new Error('지역 매장 정보를 일시적으로 불러오지 못했습니다.');
  if (result.status === 'not-found') throw new Error('지역 매장 정보를 일시적으로 불러오지 못했습니다.');
  return { region, batch: result.data };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region } = await loadRegion(params);
  const title = `${region.name} 주변 통신사 멤버십 제휴 매장 | 잇플레이스`;
  const description = `${region.name} 중심 반경 ${(region.radiusMeters / 1000).toFixed(1)}km에서 현재 확인되는 통신사 멤버십 제휴 매장과 위치를 찾아보세요.`;
  return createPageMetadata({ title, description, path: `/places/${region.slug}` });
}

export default async function StoreRegionPage({ params }: Props) {
  const { region, batch } = await loadRegion(params);
  const referenceData = await getPublicReferenceData();
  const partnersById = new Map(batch.partners.map((partner) => [partner.partnerId, partner]));
  const entries = batch.stores.map((store) => {
    const partner = partnersById.get(store.partnerId);
    const carriers = [...new Set((partner?.tierBenefit ?? []).map(({ carrier }) => carrier)
      .filter(isCarrierCode))];
    return {
      store,
      partner,
      carriers,
      distanceKm: distanceFromRegionKm(region, store),
      href: getStorePath(store.storeId, store.storeName),
    };
  });

  return (
    <section className="mx-auto min-h-[65vh] w-full max-w-[1280px] px-7 py-10 max-md:px-4 max-md:py-7">
      <nav aria-label="현재 위치" className="mb-7 text-sm text-[#686B73]"><Link href="/places" className="rounded-sm hover:text-[#6154D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154D9]">지역별 매장</Link><span className="mx-2" aria-hidden="true">/</span>{region.name}</nav>
      <h1 className="text-3xl font-bold text-[#202124] max-md:text-2xl">{region.name} 주변 멤버십 제휴 매장</h1>
      <p className="mt-3 max-w-2xl leading-7 text-[#686B73]">{region.name} 중심 반경 {(region.radiusMeters / 1000).toFixed(1)}km의 지도 검색 결과입니다. 매장까지 거리는 중심점 기준 직선거리이며 도보 이동 거리가 아닙니다. 행정구역 경계가 아니며, 제휴사 목록에 따라 매장 정보가 달라질 수 있습니다.</p>
      {entries.length ? (
        <ul className="mt-7 grid max-w-4xl gap-3 sm:grid-cols-2">
          {entries.map(({ store, partner, carriers, distanceKm, href }) => (
            <li key={store.storeId}>
              <Link href={href} className="block min-h-28 rounded-xl border border-[#E8E9EE] bg-white p-5 hover:border-[#6154D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154D9]">
                <span className="block font-semibold text-[#202124]">{store.storeName}</span>
                <span className="mt-1 block text-sm text-[#686B73]">{partner?.partnerName || '멤버십 제휴처'}{partner?.category ? ` · ${getCategoryLabel(partner.category, referenceData)}` : ''}</span>
                {(store.roadAddress || store.address) && <span className="mt-2 block text-sm text-[#686B73]">{store.roadAddress || store.address}</span>}
                {distanceKm !== null && <span className="mt-2 block text-sm text-[#686B73]">{region.name} 중심 직선거리 약 {distanceKm}km</span>}
                {carriers.length > 0 && <span className="mt-1 block text-sm text-[#686B73]">혜택 정보: {carriers.map(getCarrierLabel).join(' · ')}</span>}
              </Link>
            </li>
          ))}
        </ul>
      ) : <p className="mt-7 rounded-xl border border-[#E8E9EE] bg-white p-5 text-[#686B73]">현재 이 검색 범위에서 표시할 제휴 매장이 없습니다.</p>}
      {entries.some(({ carriers }) => carriers.length > 0) && <p className="mt-4 max-w-4xl text-sm leading-6 text-[#686B73]">표시된 통신사는 등록된 혜택 정보의 기준입니다. 개별 매장의 혜택 적용 여부나 이용 가능 여부를 보장하지 않으므로 제휴사 공식 안내를 확인해 주세요.</p>}
      {batch.hasMore && <p className="mt-4 text-sm text-[#686B73]">매장 목록을 20곳까지 표시했습니다. 더 많은 결과는 <Link href="/map" className="rounded-sm text-[#6154D9] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154D9]">지도에서 검색</Link>하세요.</p>}
      <JsonLd data={[
        {
        '@context': 'https://schema.org', '@type': 'ItemList', name: `${region.name} 주변 멤버십 제휴 매장`,
        itemListElement: entries.map(({ store, href }, index) => ({
          '@type': 'ListItem', position: index + 1, url: `${SITE_ORIGIN}${href}`,
          item: { '@type': 'Place', name: store.storeName, address: store.roadAddress || store.address || undefined,
            geo: { '@type': 'GeoCoordinates', latitude: store.latitude, longitude: store.longitude } },
        })),
        },
        {
          '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: '지역별 매장', item: `${SITE_ORIGIN}/places` },
            { '@type': 'ListItem', position: 2, name: `${region.name} 주변 매장`, item: `${SITE_ORIGIN}/places/${region.slug}` },
          ],
        },
      ]} />
    </section>
  );
}
