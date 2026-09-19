import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const configuredBaseUrl =
  process.env.USER_API_BASE_URL?.trim() || process.env.NEXT_PUBLIC_APP_BASE_URL?.trim();

if (!configuredBaseUrl) {
  throw new Error('USER_API_BASE_URL 또는 NEXT_PUBLIC_APP_BASE_URL 환경 변수가 필요합니다.');
}

const pageSize = 200;
const maximumPages = 100;
const partnersById = new Map();
let page = 0;
let totalPages = 1;

while (page < totalPages && page < maximumPages) {
  const url = new URL('/api/v1/benefits/partners', configuredBaseUrl);
  url.searchParams.set('mainCategory', 'BASIC_BENEFIT');
  url.searchParams.set('page', String(page));
  url.searchParams.set('size', String(pageSize));
  url.searchParams.set('sort', 'POPULARITY');

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`카탈로그 ${page + 1}페이지 조회 실패: HTTP ${response.status}`);
  }

  const body = await response.json();
  const data = body?.data;
  if (!data || !Array.isArray(data.content) || !Number.isInteger(data.totalPages)) {
    throw new Error(`카탈로그 ${page + 1}페이지 응답 형식이 올바르지 않습니다.`);
  }

  for (const partner of data.content) {
    if (!Number.isInteger(partner.partnerId) || typeof partner.partnerName !== 'string') {
      throw new Error(`카탈로그 ${page + 1}페이지에 잘못된 제휴처 데이터가 있습니다.`);
    }
    partnersById.set(partner.partnerId, {
      partnerId: partner.partnerId,
      partnerName: partner.partnerName,
      category: partner.category ?? null,
      image: partner.image ?? null,
      carriers: Array.isArray(partner.carriers) ? partner.carriers : [],
    });
  }

  totalPages = Math.max(1, data.totalPages);
  page += 1;
}

if (page < totalPages) {
  throw new Error(`카탈로그가 ${maximumPages}페이지를 초과해 갱신을 중단했습니다.`);
}

const catalog = {
  generatedAt: new Date().toISOString(),
  source: new URL('/api/v1/benefits/partners', configuredBaseUrl).toString(),
  partners: [...partnersById.values()],
};

const destination = resolve('src/data/partner-catalog.json');
await writeFile(destination, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
console.log(`[partner-catalog] ${catalog.partners.length}개 제휴처를 갱신했습니다.`);
