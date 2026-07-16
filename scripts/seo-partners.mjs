import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const PARTNER_CATALOG_PATH = path.resolve('scripts/data/partner-catalog.json');

export const createPartnerSlug = (partnerName) => {
  const slug = String(partnerName)
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('ko-KR')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'partner';
};

export const getPartnerBenefitPath = (partner) =>
  `/benefits/partners/${partner.partnerId}/${createPartnerSlug(partner.partnerName)}`;

const normalizeApiBaseUrl = (value) => `${value.replace(/\/+$/, '')}/`;

export const fetchLivePartnerCatalog = async () => {
  const apiBaseUrl = normalizeApiBaseUrl(
    process.env.VITE_APP_BASE_URL?.trim() || 'https://userapi.itplace.click/'
  );
  const url = new URL('api/v1/benefits/partners', apiBaseUrl);
  url.searchParams.set('mainCategory', 'BASIC_BENEFIT');
  url.searchParams.set('page', '0');
  url.searchParams.set('size', '500');
  url.searchParams.set('sort', 'POPULARITY');

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'ITPLACE-SEO-Build/1.0',
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`partner catalog API returned ${response.status}`);
  }

  const payload = await response.json();
  const partners = payload?.data?.content;
  if (!Array.isArray(partners) || partners.length === 0) {
    throw new Error('partner catalog API returned an empty payload');
  }

  return partners;
};

export const readCachedPartnerCatalog = async () => {
  const payload = JSON.parse(await readFile(PARTNER_CATALOG_PATH, 'utf8'));
  if (!Array.isArray(payload.partners) || payload.partners.length === 0) {
    throw new Error('cached partner catalog is empty');
  }
  return payload.partners;
};

export const loadPartnerCatalog = async () => {
  try {
    const partners = await fetchLivePartnerCatalog();
    return { partners, source: 'live-api' };
  } catch (error) {
    console.warn(`live partner catalog unavailable: ${error.message}`);
    const partners = await readCachedPartnerCatalog();
    return { partners, source: 'cached-catalog' };
  }
};
