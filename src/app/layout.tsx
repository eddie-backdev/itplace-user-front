import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import JsonLd from '@/components/JsonLd';
import AppProviders from './AppProviders';
import { SITE_ORIGIN } from '@/lib/metadata';
import { getPublicReferenceData } from '@/server/userApi';
import '@/index.css';

const description =
  '잇플레이스(ITPLACE, 잇플)에서 SKT, KT, LG U+ 통신 3사 멤버십 제휴처와 혜택을 지도와 목록으로 검색하고 비교하세요.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: '통신 3사 멤버십 혜택 비교·검색 | 잇플레이스',
  description,
  applicationName: '잇플레이스',
  keywords: [
    '잇플레이스',
    'ITPLACE',
    '통신 3사 멤버십',
    '멤버십 혜택',
    '제휴처 검색',
    '주변 혜택',
    '혜택 지도',
  ],
  manifest: '/site.webmanifest',
  icons: {
    icon: [{ url: '/images/brand/mark.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '잇플레이스',
    title: '통신 3사 멤버십 혜택 비교·검색 | 잇플레이스',
    description,
    url: '/',
    images: ['/images/thumbnail.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: '통신 3사 멤버십 혜택 비교·검색 | 잇플레이스',
    description,
    images: ['/images/thumbnail.png'],
  },
  other: {
    'google-adsense-account': 'ca-pub-4461526272501765',
    'format-detection': 'telephone=no',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#6154d9',
};

const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_ORIGIN}/#organization`,
      name: '잇플레이스',
      alternateName: ['ITPLACE', '잇플'],
      url: `${SITE_ORIGIN}/`,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_ORIGIN}/pwa-512x512.png`,
        width: 512,
        height: 512,
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_ORIGIN}/#website`,
      url: `${SITE_ORIGIN}/`,
      name: '잇플레이스',
      alternateName: 'ITPLACE',
      description,
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
      inLanguage: 'ko-KR',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_ORIGIN}/benefits?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_ORIGIN}/#webapp`,
      name: '잇플레이스',
      alternateName: 'ITPLACE',
      url: `${SITE_ORIGIN}/`,
      image: `${SITE_ORIGIN}/images/thumbnail.png`,
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      description:
        'SKT, KT, LG U+ 통신 3사 멤버십 제휴처의 등급별 혜택과 이용 조건을 비교하고 주변 매장을 찾는 혜택 검색 서비스',
      isAccessibleForFree: true,
      inLanguage: 'ko-KR',
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
    },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const referenceData = await getPublicReferenceData();

  return (
    <html lang="ko">
      <body>
        <AppProviders initialReferenceData={referenceData}>{children}</AppProviders>
        <JsonLd data={websiteStructuredData} />
      </body>
    </html>
  );
}
