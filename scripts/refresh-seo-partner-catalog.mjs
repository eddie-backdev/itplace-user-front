import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  fetchLivePartnerCatalog,
  fetchLivePartnerDetails,
  PARTNER_CATALOG_PATH,
  PARTNER_DETAILS_PATH,
} from './seo-partners.mjs';

const partners = await fetchLivePartnerCatalog();
const detailResults = await fetchLivePartnerDetails(partners);
const failedPartnerIds = detailResults.flatMap(({ detail }, index) =>
  detail ? [] : [partners[index].partnerId]
);
if (failedPartnerIds.length > 0) {
  throw new Error(`failed to refresh partner details: ${failedPartnerIds.join(', ')}`);
}

const generatedAt = new Date().toISOString();
const catalogPayload = {
  generatedAt,
  source: 'https://userapi.itplace.click/api/v1/benefits/partners',
  partners,
};
const detailsPayload = {
  generatedAt,
  source: 'https://userapi.itplace.click/api/v1/benefits/partners/{partnerId}',
  partnerDetails: detailResults.map(({ detail }) => detail),
};

await Promise.all([
  mkdir(path.dirname(PARTNER_CATALOG_PATH), { recursive: true }),
  mkdir(path.dirname(PARTNER_DETAILS_PATH), { recursive: true }),
]);
await Promise.all([
  writeFile(PARTNER_CATALOG_PATH, `${JSON.stringify(catalogPayload, null, 2)}\n`, 'utf8'),
  writeFile(PARTNER_DETAILS_PATH, `${JSON.stringify(detailsPayload)}\n`, 'utf8'),
]);

console.log(
  `saved ${partners.length} partners and ${detailsPayload.partnerDetails.length} partner details`
);
