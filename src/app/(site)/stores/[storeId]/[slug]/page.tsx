import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import { getPublicPartnerBenefitDetail } from '@/server/userApi';
import { getPublicReferenceData } from '@/server/userApi';
import { getStoreSeoDetail } from '@/server/storeApi';
import { createPageMetadata, SITE_ORIGIN } from '@/lib/metadata';
import { createStoreSlug, getStorePath } from '@/utils/storeSeo';
import { getPartnerBenefitPath } from '@/utils/partnerSeo';
import { getCategoryLabel } from '@/utils/referenceData';
import { getCarrierLabel } from '@/utils/membership';

type Props = { params: Promise<{ storeId: string; slug: string }> };

const fetchStore = async (params: Props['params']) => {
  const { storeId, slug } = await params;
  const numericStoreId = /^\d+$/.test(storeId) ? Number(storeId) : NaN;
  const result = await getStoreSeoDetail(numericStoreId);
  if (result.status === 'not-found') notFound();
  if (result.status === 'unavailable') throw new Error('매장 정보를 일시적으로 불러오지 못했습니다.');
  const path = getStorePath(result.data.store.storeId, result.data.store.storeName);
  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch {
    // Invalid escapes fall through to the canonical redirect.
  }
  if (storeId !== String(result.data.store.storeId) || decodedSlug !== createStoreSlug(result.data.store.storeName)) {
    permanentRedirect(encodeURI(path));
  }
  return result.data;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await fetchStore(params);
  const { store, partner } = data;
  const address = store.roadAddress || store.address;
  const title = `${store.storeName} 위치·주소 | ${partner.partnerName} 제휴처 | 잇플레이스`;
  const description = `${store.storeName} 매장 위치와 주소를 확인하세요.${address ? ` 주소: ${address}.` : ''} ${partner.partnerName}의 통신사 멤버십 혜택과 이용 조건은 제휴사 안내에서 확인할 수 있습니다.`;
  return createPageMetadata({ title, description, path: getStorePath(store.storeId, store.storeName) });
}

export default async function StoreSeoPage({ params }: Props) {
  const data = await fetchStore(params);
  const { store, partner } = data;
  const partnerPath = getPartnerBenefitPath(partner.partnerId, partner.partnerName);
  const address = store.roadAddress || store.address;
  const [benefits, referenceData] = await Promise.all([
    getPublicPartnerBenefitDetail(partner.partnerId),
    getPublicReferenceData(),
  ]);
  const benefitLinks = [...new Set(benefits?.carrierGroups.flatMap((group) =>
    group.benefits.map((benefit) => benefit.sourceUrl || benefit.url)
  ) ?? [])].filter((url): url is string => Boolean(url));
  const mapUrl = `https://map.kakao.com/link/map/${encodeURIComponent(store.storeName)},${store.latitude},${store.longitude}`;

  return (
    <section className="mx-auto min-h-[65vh] w-full max-w-[1280px] px-7 py-10 max-md:px-4 max-md:py-7">
      <nav aria-label="현재 위치" className="mb-7 text-sm text-[#686B73]">
        <Link href="/places" className="rounded-sm hover:text-[#6154D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154D9]">지역별 매장</Link>
        <span className="mx-2" aria-hidden="true">/</span><span>{partner.partnerName}</span>
      </nav>
      <article className="max-w-3xl rounded-2xl border border-[#E8E9EE] bg-white p-7 shadow-sm max-md:p-5">
        <p className="mb-2 text-sm font-medium text-[#6154D9]">{getCategoryLabel(partner.category, referenceData) || '멤버십 제휴처'}</p>
        <h1 className="text-3xl font-bold leading-tight text-[#202124] max-md:text-2xl">{store.storeName}</h1>
        <p className="mt-2 text-[#686B73]">{partner.partnerName} 매장 정보</p>
        <section aria-labelledby="store-address-title" className="mt-7 border-t border-[#E8E9EE] pt-5">
          <h2 id="store-address-title" className="font-semibold text-[#202124]">주소</h2>
          {address ? <p className="mt-2 text-[#202124]">{address}</p> : <p className="mt-2 text-sm text-[#686B73]">등록된 주소가 없습니다.</p>}
          {(store.city || store.town || store.legalDong) && <p className="mt-1 text-sm text-[#686B73]">{[store.city, store.town, store.legalDong].filter(Boolean).join(' ')}</p>}
          {store.postCode && <p className="mt-1 text-sm text-[#686B73]">우편번호 {store.postCode}</p>}
        </section>
        {store.business && <p className="mt-3 text-sm text-[#686B73]">업종 {store.business}</p>}
        <section aria-labelledby="store-visit-title" className="mt-6">
          <h2 id="store-visit-title" className="font-semibold text-[#202124]">방문 정보</h2>
          <p className="mt-2 text-sm leading-6 text-[#686B73]">주소와 지도 위치를 확인한 뒤 방문해 주세요. 운영 시간과 휴무 정보는 제공되지 않습니다.</p>
        </section>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-lg bg-[#6154D9] px-4 font-semibold text-white hover:bg-[#5145c5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154D9] focus-visible:ring-offset-2">카카오맵에서 위치 보기</a>
          <Link href={partnerPath} className="inline-flex min-h-11 items-center rounded-lg border border-[#E8E9EE] px-4 font-semibold text-[#202124] hover:border-[#6154D9] hover:text-[#6154D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154D9]">{partner.partnerName} 혜택 확인</Link>
        </div>
      </article>

      <section aria-labelledby="partner-benefit-title" className="mt-9 max-w-3xl">
        <h2 id="partner-benefit-title" className="text-xl font-bold text-[#202124]">{partner.partnerName} 브랜드 혜택</h2>
        <p className="mt-2 text-sm leading-6 text-[#686B73]">아래 내용은 제휴 브랜드 전체에 등록된 혜택 정보입니다. 이 매장에서 혜택을 이용할 수 있다는 보장은 아니며, 적용 매장과 조건은 제휴사 공식 안내에서 확인해 주세요.</p>
        {benefits?.carrierGroups.length ? <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {benefits.carrierGroups.map((group) => <li key={group.carrier} className="rounded-xl border border-[#E8E9EE] bg-white p-4">
            <h3 className="font-semibold text-[#202124]">{getCarrierLabel(group.carrier)}</h3>
            <p className="mt-1 text-sm text-[#686B73]">등록 혜택 {group.benefits.length}개</p>
            <p className="mt-2 text-sm leading-6 text-[#686B73]">{group.benefits.slice(0, 2).map((benefit) => benefit.displayName || benefit.benefitName).join(' · ')}{group.benefits.length > 2 ? ' 외' : ''}</p>
          </li>)}</ul> : <p className="mt-4 text-sm text-[#686B73]">현재 표시할 브랜드 혜택 정보가 없습니다.</p>}
        {benefitLinks.length ? (
          <ul aria-label="제휴사 공식 혜택 안내 링크" className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {benefitLinks.map((url) => (
              <li key={url}><a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm text-[#6154D9] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154D9]">제휴사 공식 안내 보기</a></li>
            ))}
          </ul>
        ) : <p className="mt-4 text-sm text-[#686B73]">별도 연결된 제휴사 공식 안내가 없습니다. <Link href={partnerPath} className="inline-flex min-h-11 items-center text-[#6154D9] underline underline-offset-2">제휴사 혜택 확인</Link></p>}
      </section>
      <JsonLd data={[
        {
          '@context': 'https://schema.org', '@type': 'Place', name: store.storeName,
          address: address ? { '@type': 'PostalAddress', streetAddress: address, addressLocality: store.town || undefined, addressRegion: store.city || undefined, postalCode: store.postCode || undefined, addressCountry: 'KR' } : undefined,
          geo: { '@type': 'GeoCoordinates', latitude: store.latitude, longitude: store.longitude },
        },
        {
          '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: '지역별 매장', item: `${SITE_ORIGIN}/places` },
            { '@type': 'ListItem', position: 2, name: partner.partnerName, item: `${SITE_ORIGIN}${partnerPath}` },
            { '@type': 'ListItem', position: 3, name: store.storeName, item: `${SITE_ORIGIN}${getStorePath(store.storeId, store.storeName)}` },
          ],
        },
      ]} />
    </section>
  );
}
