import { useEffect } from 'react';

const SITE_ORIGIN = 'https://itplace.click';

type PageSeoProps = {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
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

const PageSeo = ({ title, description, path = '/', noIndex = false }: PageSeoProps) => {
  useEffect(() => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const canonicalUrl = `${SITE_ORIGIN}${normalizedPath}`;

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

    if (noIndex) {
      setMetaTag('meta[name="robots"]', { content: 'noindex,follow' });
    } else {
      const robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
      robots?.remove();
    }
  }, [description, noIndex, path, title]);

  return null;
};

export default PageSeo;
