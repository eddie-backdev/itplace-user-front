import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fetchLivePartnerCatalog, PARTNER_CATALOG_PATH } from './seo-partners.mjs';

const partners = await fetchLivePartnerCatalog();
const payload = {
  generatedAt: new Date().toISOString(),
  source: 'https://userapi.itplace.click/api/v1/benefits/partners',
  partners,
};

await mkdir(path.dirname(PARTNER_CATALOG_PATH), { recursive: true });
await writeFile(PARTNER_CATALOG_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

console.log(`saved ${partners.length} partners to ${PARTNER_CATALOG_PATH}`);
