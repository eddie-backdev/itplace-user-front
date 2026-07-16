import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getPartnerBenefitPath, readCachedPartnerCatalog } from './seo-partners.mjs';

const DIST_DIR = path.resolve('dist');
const failures = [];

const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const readDist = (relativePath) => readFile(path.join(DIST_DIR, relativePath), 'utf8');
const getTitle = (html) => html.match(/<title>(.*?)<\/title>/s)?.[1] ?? '';

const homeHtml = await readDist('index.html');
check(
  getTitle(homeHtml) === '잇플레이스 | 통신 3사 멤버십 혜택 검색',
  'home title is not the branded search title'
);
check(homeHtml.includes('"name": "잇플레이스"'), 'home WebSite/Organization name is missing');
check(
  homeHtml.includes('rel="canonical" href="https://itplace.click/"'),
  'home canonical is missing'
);

const membershipPaths = [
  'membership/index.html',
  'membership/skt/index.html',
  'membership/kt/index.html',
  'membership/lguplus/index.html',
];
const membershipHtml = await Promise.all(membershipPaths.map(readDist));
const membershipTitles = membershipHtml.map(getTitle);
check(
  new Set(membershipTitles).size === membershipTitles.length,
  'membership titles are not unique'
);
check(
  membershipHtml.every((html) => html.includes('data-prerender-fallback="true"')),
  'membership prerender fallback is missing'
);
check(
  membershipHtml.some((html) => html.includes('/benefits/partners/')),
  'membership pages do not contain partner internal links'
);

const cachedPartners = await readCachedPartnerCatalog();
const samplePartner =
  cachedPartners.find((partner) => partner.partnerName === 'GS25') ?? cachedPartners[0];
const samplePartnerPath = getPartnerBenefitPath(samplePartner);
const samplePartnerHtml = await readDist(`${samplePartnerPath.slice(1)}/index.html`);
check(
  samplePartnerHtml.includes(`<h1>${samplePartner.partnerName} 멤버십 혜택</h1>`),
  'partner prerender heading is missing'
);
check(
  [...samplePartnerHtml.matchAll(/<h1>/g)].length === 1,
  'partner prerender output contains duplicate h1 headings'
);
check(
  samplePartnerHtml.includes(new URL(samplePartnerPath, 'https://itplace.click').href),
  'partner canonical URL is missing'
);

const sitemap = await readDist('sitemap.xml');
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
check(new Set(sitemapUrls).size === sitemapUrls.length, 'sitemap contains duplicate URLs');
check(
  sitemapUrls.length >= cachedPartners.length + 14,
  `sitemap URL count is too small: ${sitemapUrls.length}`
);
check(
  sitemapUrls.includes(new URL(samplePartnerPath, 'https://itplace.click').href),
  'sample partner is missing from sitemap'
);
check(!sitemap.includes('<lastmod>'), 'sitemap contains an inaccurate fixed lastmod value');
check(!sitemap.includes('/login'), 'noindex login route leaked into sitemap');
check(!sitemap.includes('/mypage'), 'noindex mypage route leaked into sitemap');

const robots = await readDist('robots.txt');
check(
  robots.includes('Sitemap: https://itplace.click/sitemap.xml'),
  'robots.txt sitemap declaration is missing'
);

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`SEO check failed: ${failure}`));
  process.exitCode = 1;
} else {
  console.log(
    `SEO output verified: ${sitemapUrls.length} sitemap URLs, ${cachedPartners.length} cached partners, unique membership titles`
  );
}
