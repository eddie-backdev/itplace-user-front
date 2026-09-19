import type { Metadata } from 'next';

export const SITE_ORIGIN = 'https://itplace.click';
export const DEFAULT_SOCIAL_IMAGE = '/images/thumbnail.png';

type PageMetadataOptions = {
  title: string;
  socialTitle?: string;
  description: string;
  path: string;
  noIndex?: boolean;
  image?: string;
};

export const createPageMetadata = ({
  title,
  socialTitle = title,
  description,
  path,
  noIndex = false,
  image = DEFAULT_SOCIAL_IMAGE,
}: PageMetadataOptions): Metadata => ({
  title,
  description,
  alternates: { canonical: path },
  robots: noIndex ? { index: false, follow: true } : { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '잇플레이스',
    title: socialTitle,
    description,
    url: path,
    images: [{ url: image }],
  },
  twitter: {
    card: 'summary_large_image',
    title: socialTitle,
    description,
    images: [image],
  },
});
