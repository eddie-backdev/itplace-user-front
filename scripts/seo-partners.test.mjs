import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchLivePartnerCatalog, normalizePartnerDetail } from './seo-partners.mjs';

test('SEO catalog respects API page size and rejects incomplete or duplicate pages', async (t) => {
  const partners = Array.from({ length: 103 }, (_, index) => ({ partnerId: index + 1 }));
  const requestedPages = [];
  let duplicateLastPage = false;
  let omitLastPage = false;
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url.searchParams.get('size'), '100');
    const page = Number(url.searchParams.get('page'));
    requestedPages.push(page);
    return Response.json({
      data: {
        content: omitLastPage
          ? []
          : duplicateLastPage && page === 1
            ? partners.slice(0, 3)
            : partners.slice(page * 100, (page + 1) * 100),
        totalPages: 2,
        totalElements: 103,
      },
    });
  });
  assert.deepEqual(await fetchLivePartnerCatalog(), partners);
  assert.deepEqual(requestedPages, [0, 1]);
  duplicateLastPage = true;
  await assert.rejects(fetchLivePartnerCatalog(), /incomplete data/);
  duplicateLastPage = false;
  omitLastPage = true;
  await assert.rejects(fetchLivePartnerCatalog(), /incomplete data/);
});

test('SEO detail preserves source and concrete limits when duplicate records are merged', () => {
  const longManual = '이용 조건을 확인하세요. '.repeat(100);
  const detail = normalizePartnerDetail({
    partnerId: 112,
    partnerName: 'GS25',
    carrierGroups: [
      {
        carrier: 'KT',
        benefits: [
          { benefitId: 502, benefitLimit: '제한없음', tierBenefits: [] },
          {
            benefitId: 502,
            benefitLimit: '일 1회',
            manual: longManual,
            sourceUrl: 'https://carrier.example/gs25',
            tierBenefits: [],
          },
          { benefitId: 503, benefitLimit: '제한없음', tierBenefits: [] },
        ],
      },
    ],
  });
  const benefits = detail.carrierGroups[0].benefits;
  assert.equal(benefits.length, 2);
  assert.equal(benefits[0].benefitLimit, '일 1회');
  assert.equal(benefits[0].manual, longManual.trim());
  assert.equal(benefits[0].sourceUrl, 'https://carrier.example/gs25');
  assert.equal(benefits[1].benefitLimit, '이용 방법에서 횟수·한도 확인');
});
