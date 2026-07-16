import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const PARTNER_CATALOG_PATH = path.resolve('scripts/data/partner-catalog.json');
export const PARTNER_DETAILS_PATH = path.resolve('scripts/data/partner-benefit-details.json');

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
const getApiBaseUrl = () =>
  normalizeApiBaseUrl(
    process.env.VITE_APP_BASE_URL?.trim() || 'https://userapi.itplace.click/'
  );

const apiHeaders = {
  Accept: 'application/json',
  'User-Agent': 'ITPLACE-SEO-Build/1.0',
};

const textRichness = (value) => String(value ?? '').trim().length;

const normalizeSeoManual = (value, maxLength = 700) => {
  const compacted = String(value ?? '').replace(/\s+/g, ' ').trim();
  return compacted.length > maxLength ? compacted.slice(0, maxLength).trim() + '…' : compacted;
};

const getBenefitRichness = (benefit) =>
  textRichness(benefit.description) +
  textRichness(benefit.benefitLimit) * 2 +
  textRichness(benefit.manual) * 3 +
  textRichness(benefit.url) +
  (benefit.tierBenefits?.length ?? 0) * 20;

const mergeTierBenefits = (primary = [], secondary = []) => {
  const tierBenefitsByKey = new Map();
  [...primary, ...secondary].forEach((tierBenefit) => {
    const key = [
      tierBenefit.carrier ?? '',
      tierBenefit.grade ?? '',
      tierBenefit.context ?? '',
      tierBenefit.onlineContext ?? '',
      tierBenefit.offlineContext ?? '',
      tierBenefit.isAll ?? false,
    ].join('|');
    tierBenefitsByKey.set(key, tierBenefit);
  });
  return [...tierBenefitsByKey.values()];
};

const mergeDuplicateBenefit = (current, candidate) => {
  const [primary, secondary] =
    getBenefitRichness(candidate) > getBenefitRichness(current)
      ? [candidate, current]
      : [current, candidate];

  return {
    ...secondary,
    ...primary,
    description: primary.description?.trim() ? primary.description : secondary.description,
    benefitLimit: primary.benefitLimit?.trim() ? primary.benefitLimit : secondary.benefitLimit,
    manual: primary.manual?.trim() ? primary.manual : secondary.manual,
    url: primary.url?.trim() ? primary.url : secondary.url,
    tierBenefits: mergeTierBenefits(primary.tierBenefits, secondary.tierBenefits),
  };
};

export const normalizePartnerDetail = (detail) => ({
  partnerId: detail.partnerId,
  partnerName: detail.partnerName,
  category: detail.category ?? null,
  image: detail.image ?? null,
  carrierGroups: (detail.carrierGroups ?? []).map((group) => {
    const benefitsById = new Map();
    (group.benefits ?? []).forEach((benefit) => {
      const sanitizedBenefit = {
        benefitId: benefit.benefitId,
        benefitName: benefit.benefitName,
        description: benefit.description ?? null,
        benefitLimit: benefit.benefitLimit ?? null,
        manual: benefit.manual ? normalizeSeoManual(benefit.manual) : null,
        url: benefit.url ?? null,
        usageType: benefit.usageType,
        tierBenefits: (benefit.tierBenefits ?? []).map((tierBenefit) => ({
          carrier: tierBenefit.carrier ?? null,
          grade: tierBenefit.grade,
          context: tierBenefit.context,
          isAll: tierBenefit.isAll,
        })),
      };
      const current = benefitsById.get(sanitizedBenefit.benefitId);
      benefitsById.set(
        sanitizedBenefit.benefitId,
        current ? mergeDuplicateBenefit(current, sanitizedBenefit) : sanitizedBenefit
      );
    });
    return { carrier: group.carrier, benefits: [...benefitsById.values()] };
  }),
});

export const fetchLivePartnerCatalog = async () => {
  const url = new URL('api/v1/benefits/partners', getApiBaseUrl());
  url.searchParams.set('mainCategory', 'BASIC_BENEFIT');
  url.searchParams.set('page', '0');
  url.searchParams.set('size', '500');
  url.searchParams.set('sort', 'POPULARITY');

  const response = await fetch(url, {
    headers: apiHeaders,
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

export const fetchLivePartnerDetail = async (partnerId) => {
  const url = new URL(`api/v1/benefits/partners/${partnerId}`, getApiBaseUrl());
  url.searchParams.set('mainCategory', 'BASIC_BENEFIT');
  const response = await fetch(url, {
    headers: apiHeaders,
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`partner ${partnerId} detail API returned ${response.status}`);
  }

  const payload = await response.json();
  if (!payload?.data?.partnerId) {
    throw new Error(`partner ${partnerId} detail API returned an invalid payload`);
  }
  return normalizePartnerDetail(payload.data);
};

const mapWithConcurrency = async (items, concurrency, mapper) => {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  });
  await Promise.all(workers);
  return results;
};

export const fetchLivePartnerDetails = async (partners, concurrency = 8) =>
  mapWithConcurrency(partners, concurrency, async (partner) => {
    try {
      return { detail: await fetchLivePartnerDetail(partner.partnerId), error: null };
    } catch (error) {
      return { detail: null, error };
    }
  });

export const readCachedPartnerCatalog = async () => {
  const payload = JSON.parse(await readFile(PARTNER_CATALOG_PATH, 'utf8'));
  if (!Array.isArray(payload.partners) || payload.partners.length === 0) {
    throw new Error('cached partner catalog is empty');
  }
  return payload.partners;
};

export const readCachedPartnerDetails = async () => {
  const payload = JSON.parse(await readFile(PARTNER_DETAILS_PATH, 'utf8'));
  if (!Array.isArray(payload.partnerDetails) || payload.partnerDetails.length === 0) {
    throw new Error('cached partner details are empty');
  }
  return payload.partnerDetails.map(normalizePartnerDetail);
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

export const loadPartnerDetails = async (partners) => {
  let cachedDetails = [];
  try {
    cachedDetails = await readCachedPartnerDetails();
  } catch (error) {
    console.warn(`cached partner details unavailable: ${error.message}`);
  }
  const cachedById = new Map(cachedDetails.map((detail) => [detail.partnerId, detail]));
  const liveResults = await fetchLivePartnerDetails(partners);
  let liveCount = 0;
  let cachedCount = 0;
  const details = liveResults.flatMap(({ detail, error }, index) => {
    if (detail) {
      liveCount += 1;
      return [detail];
    }
    const partner = partners[index];
    const cachedDetail = cachedById.get(partner.partnerId);
    if (cachedDetail) {
      cachedCount += 1;
      return [cachedDetail];
    }
    console.warn(`partner detail unavailable for ${partner.partnerId}: ${error?.message}`);
    return [];
  });

  return {
    details,
    source: `${liveCount} live, ${cachedCount} cached, ${partners.length - details.length} missing`,
  };
};
