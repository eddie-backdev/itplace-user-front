import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  getPartnerBenefitPath,
  readCachedPartnerCatalog,
  readCachedPartnerDetails,
} from './seo-partners.mjs';

const DIST_DIR = path.resolve('dist');
const failures = [];

const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const readDist = (relativePath) => readFile(path.join(DIST_DIR, relativePath), 'utf8');
const getTitle = (html) => html.match(/<title>(.*?)<\/title>/s)?.[1] ?? '';

const homeHtml = await readDist('index.html');
check(getTitle(homeHtml) === 'ITPLACE', 'home browser title is not the ITPLACE brand name');
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
check(
  samplePartnerHtml.includes('data-prerender-seo="true"') &&
    samplePartnerHtml.includes('"mainEntity":{"@type":"ItemList"'),
  'partner benefit ItemList structured data is missing'
);
if (samplePartner.partnerName === 'GS25') {
  check(samplePartnerHtml.includes('GS25 할인형'), 'GS25 actual benefit content is missing');
  check(
    [...samplePartnerHtml.matchAll(/data-benefit-id="502"/g)].length === 1,
    'duplicate GS25 KT benefit was not normalized'
  );
}

const sitemap = await readDist('sitemap.xml');
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
check(new Set(sitemapUrls).size === sitemapUrls.length, 'sitemap contains duplicate URLs');
check(
  sitemapUrls.filter((url) => url.includes('/benefits/partners/')).length > 0 &&
    sitemapUrls.length >= 15,
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

const redirects = await readDist('_redirects');
check(
  redirects.trim().split('\n').length <= 2_000,
  'Cloudflare static redirect limit was exceeded'
);
check(redirects.includes('/membership/ /membership 301'), 'membership slash redirect is missing');
check(
  redirects.includes(`${samplePartnerPath}/ ${samplePartnerPath} 301`),
  'partner slash redirect is missing'
);
check(
  redirects.includes(`${samplePartnerPath}.html ${samplePartnerPath} 301`),
  'partner html redirect is missing'
);

const content = async (name) =>
  JSON.parse(await readFile(new URL(`../src/content/${name}.json`, import.meta.url), 'utf8'));
const [policy, guide, faqs, notes] = await Promise.all(
  ['privacy-policy', 'membership-guide', 'membership-faq', 'partner-notes'].map(content)
);
const [privacyHtml, guideHtml, faqHtml, benefitsHtml] = await Promise.all(
  ['privacy/index.html', 'guide/index.html', 'faq/index.html', 'benefits/index.html'].map(readDist)
);
const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
for (const section of policy.sections) {
  for (const item of section.items)
    check(
      privacyHtml.includes(escapeHtml(item)),
      `privacy policy paragraph missing: ${section.title}`
    );
  for (const link of section.links)
    check(
      privacyHtml.includes(`href="${escapeHtml(link.href)}"`),
      `privacy choice link missing: ${link.label}`
    );
}
for (const step of guide.steps)
  check(guideHtml.includes(escapeHtml(step.body)), `guide step missing: ${step.title}`);
for (const faq of faqs)
  check(faqHtml.includes(escapeHtml(faq.answer)), `FAQ answer missing: ${faq.question}`);
for (const note of notes) {
  const partner = cachedPartners.find((item) => item.partnerId === note.partnerId);
  if (!partner) continue;
  const html = await readDist(`${getPartnerBenefitPath(partner).slice(1)}/index.html`);
  check(
    html.includes(note.sourceUrl) && html.includes(note.checkedAt),
    'editorial note is missing its source or verification date'
  );
  for (const paragraph of note.paragraphs)
    check(html.includes(escapeHtml(paragraph)), 'editorial explanation missing');
}
check(
  benefitsHtml.includes('GS25') && benefitsHtml.includes('SKT:'),
  'public benefit listing has no actual benefit summary'
);
check(
  homeHtml.includes('data-prerender-fallback="true"') && homeHtml.includes('/benefits/partners/'),
  'home has no public benefit content'
);
check(!samplePartnerHtml.includes('제한없음'), 'unparsed benefit limit promises unlimited use');
for (const html of [privacyHtml, guideHtml, faqHtml, samplePartnerHtml]) {
  check(
    /<div id="root">\s*<main data-prerender-fallback/.test(html),
    'public content is outside the React root'
  );
  check(!html.includes('?.remove()'), 'public content is removed before React can load');
}
const airclass = cachedPartners.find((partner) => partner.partnerName === '에어클래스');
if (airclass) {
  const html = await readDist(`${getPartnerBenefitPath(airclass).slice(1)}/index.html`);
  check(
    !html.includes('KT_WHITE') && !html.includes('KT_SILVER'),
    'internal membership grade code leaked into HTML'
  );
  check(html.includes('https://membership.kt.com/'), 'carrier fallback source is missing');
}

const cachedPartnerDetails = await readCachedPartnerDetails();
check(
  cachedPartnerDetails.length >= cachedPartners.length,
  `cached partner detail count is too small: ${cachedPartnerDetails.length}`
);

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`SEO check failed: ${failure}`));
  process.exitCode = 1;
} else {
  console.log(
    `SEO output verified: ${sitemapUrls.length} sitemap URLs, ${sitemapUrls.filter((url) => url.includes('/benefits/partners/')).length} partners with actual benefit content, canonical redirects, unique membership titles`
  );
}
