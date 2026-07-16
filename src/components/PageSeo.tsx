import { useEffect } from 'react';

const SITE_ORIGIN = 'https://itplace.click';
const DEFAULT_SOCIAL_IMAGE = `${SITE_ORIGIN}/images/thumbnail.png`;

type PageSeoProps = {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
  image?: string;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
};

const setMetaTag = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    const match = selector.match(/\[(name|property)="(.+)"\]/);
    if (match) {
      element.setAttribute(match[1], match[2]);
    }
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
};

const setCanonical = (href: string) => {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }

  link.setAttribute('href', href);
};

const PageSeo = ({
  title,
  description,
  path = '/',
  noIndex = false,
  image,
  structuredData,
}: PageSeoProps) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const canonicalUrl = `${SITE_ORIGIN}${normalizedPath}`;
  const structuredDataJson = noIndex
    ? null
    : JSON.stringify(
        structuredData ?? {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: title,
          description,
          url: canonicalUrl,
          isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
        }
      );

  useEffect(() => {
    document.title = title;
    setCanonical(canonicalUrl);
    setMetaTag('meta[name="description"]', { content: description });
    setMetaTag('meta[property="og:title"]', { property: 'og:title', content: title });
    setMetaTag('meta[property="og:description"]', {
      property: 'og:description',
      content: description,
    });
    setMetaTag('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    setMetaTag('meta[name="twitter:title"]', { content: title });
    setMetaTag('meta[name="twitter:description"]', { content: description });

    const socialImage = image ?? DEFAULT_SOCIAL_IMAGE;
    setMetaTag('meta[property="og:image"]', { property: 'og:image', content: socialImage });
    setMetaTag('meta[name="twitter:image"]', { content: socialImage });

    const existingStructuredData = document.head.querySelector<HTMLScriptElement>(
      'script[data-page-seo="true"], script[data-prerender-seo="true"]'
    );
    if (structuredDataJson) {
      const script = existingStructuredData ?? document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.pageSeo = 'true';
      script.removeAttribute('data-prerender-seo');
      script.textContent = structuredDataJson;
      if (!existingStructuredData) {
        document.head.appendChild(script);
      }
    } else {
      existingStructuredData?.remove();
    }

    if (noIndex) {
      setMetaTag('meta[name="robots"]', { content: 'noindex,follow' });
    } else {
      const robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
      robots?.remove();
    }
  }, [canonicalUrl, description, image, noIndex, structuredDataJson, title]);

  return null;
};

export default PageSeo;
