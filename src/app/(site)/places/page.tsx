import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { storeRegions } from '@/data/storeRegions';
import { createPageMetadata, SITE_ORIGIN } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata({
  title: '지역별 멤버십 제휴 매장 찾기 | 잇플레이스',
  description: '강남역과 홍대입구역 주변의 통신사 멤버십 제휴 매장을 실제 지도 데이터로 확인하세요.',
  path: '/places',
});

export default function PlacesIndexPage() {
  return (
    <section className="mx-auto min-h-[65vh] w-full max-w-[1280px] px-7 py-10 max-md:px-4 max-md:py-7">
      <p className="text-sm font-semibold text-[#6154D9]">ITPLACE 지역 검색</p>
      <h1 className="mt-2 text-3xl font-bold text-[#202124] max-md:text-2xl">지역별 멤버십 제휴 매장</h1>
      <p className="mt-3 max-w-2xl leading-7 text-[#686B73]">역 주변 반경 안에서 현재 확인되는 제휴 매장을 찾아보세요. 각 지역은 행정구역이 아니라 역 중심 검색 범위입니다.</p>
      <ul className="mt-7 grid max-w-3xl gap-3 sm:grid-cols-2">
        {storeRegions.map((region) => (
          <li key={region.slug}>
            <Link href={`/places/${region.slug}`} className="flex min-h-20 items-center justify-between rounded-xl border border-[#E8E9EE] bg-white px-5 py-4 font-semibold text-[#202124] hover:border-[#6154D9] hover:text-[#6154D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154D9]">
              {region.name} 주변 매장 <span aria-hidden="true">→</span>
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
