import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { storeRegions } from '@/data/storeRegions';
import { createPageMetadata, SITE_ORIGIN } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata({
  title: '지역별 멤버십 제휴 매장 찾기 | 잇플레이스',
  description: '역 중심으로 설정된 검색 반경 안에서 통신사 멤버십 제휴 매장을 확인하고, 매장별 주소와 지도 위치를 살펴보세요.',
  path: '/places',
});

export default function PlacesIndexPage() {
  const searchAreas = storeRegions.map((region) => `${region.name} 중심 ${(
    region.radiusMeters / 1000
  ).toFixed(1)}km`).join(', ');

  return (
    <section className="mx-auto min-h-[65vh] w-full max-w-[1280px] px-7 py-10 max-md:px-4 max-md:py-7">
      <p className="text-sm font-semibold text-accent">ITPLACE 지역 검색</p>
      <h1 className="mt-2 text-3xl font-bold text-ink max-md:text-2xl">지역별 멤버십 제휴 매장</h1>
      <p className="mt-3 max-w-2xl leading-7 text-warmMuted">{searchAreas} 검색 반경에서 현재 확인되는 제휴 매장을 찾아보세요. 지역을 선택하면 등록된 매장 이름과 주소를 확인할 수 있고, 매장 페이지에서 지도 위치와 브랜드 혜택 안내로 이어집니다. 검색 범위는 행정구역 경계와 다를 수 있습니다.</p>
      <ul className="mt-7 grid max-w-3xl gap-3 sm:grid-cols-2">
        {storeRegions.map((region) => (
          <li key={region.slug}>
            <Link href={`/places/${region.slug}`} className="flex min-h-20 items-center justify-between rounded-xl border border-warmBorder bg-warmSurface px-5 py-4 font-semibold text-ink hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <span><span className="block">{region.name} 주변 매장</span><span className="mt-1 block text-sm font-normal text-warmMuted">역 중심 반경 {(region.radiusMeters / 1000).toFixed(1)}km 검색</span></span><span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: '지역별 매장', item: `${SITE_ORIGIN}/places` },
        ],
      }} />
    </section>
  );
}
