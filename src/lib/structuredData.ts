import { SITE_ORIGIN } from './metadata';

export const createPageStructuredData = ({
  title,
  description,
  path,
  pageType = 'WebPage',
}: {
  title: string;
  description: string;
  path: string;
  pageType?: 'WebPage' | 'CollectionPage';
}) => ({
  '@context': 'https://schema.org',
  '@type': pageType,
  name: title,
  description,
  url: `${SITE_ORIGIN}${path}`,
  isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
});

type CollectionPageStructuredDataOptions = {
  name: string;
  description: string;
  path: string;
  parentName?: string;
  parentPath?: string;
};

export const createCollectionPageStructuredData = ({
  name,
  description,
  path,
  parentName,
  parentPath,
}: CollectionPageStructuredDataOptions) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name,
  description,
  url: `${SITE_ORIGIN}${path}`,
  isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '홈',
        item: `${SITE_ORIGIN}/`,
      },
      ...(parentName && parentPath
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: parentName,
              item: `${SITE_ORIGIN}${parentPath}`,
            },
          ]
        : []),
      {
        '@type': 'ListItem',
        position: parentName && parentPath ? 3 : 2,
        name,
        item: `${SITE_ORIGIN}${path}`,
      },
    ],
  },
});
