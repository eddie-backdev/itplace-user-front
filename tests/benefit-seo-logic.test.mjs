import assert from 'node:assert/strict';
import test from 'node:test';
import { getBenefitsSeoPolicy } from '../src/utils/benefitsSeo.mjs';
import { getApplicableTierBenefits } from '../src/features/allBenefitsPage/apis/tierBenefitResolver.mjs';
import { isCanonicalPartnerSlug } from '../src/utils/partnerSlug.mjs';

test('Korean partner slugs compare canonically whether URL params are encoded or decoded', () => {
  assert.equal(isCanonicalPartnerSlug('아웃백-스테이크하우스', '아웃백-스테이크하우스'), true);
  assert.equal(isCanonicalPartnerSlug(encodeURIComponent('아웃백-스테이크하우스'), '아웃백-스테이크하우스'), true);
  assert.equal(isCanonicalPartnerSlug('잘못된-슬러그', '아웃백-스테이크하우스'), false);
});

test('benefit collection pagination pages have their own clean canonical URLs', () => {
  assert.deepEqual(getBenefitsSeoPolicy({}), {
    page: 1,
    canonicalPath: '/benefits',
    noIndex: false,
  });
  assert.equal(getBenefitsSeoPolicy({ page: '1' }).canonicalPath, '/benefits');
  assert.equal(getBenefitsSeoPolicy({ page: '2' }).canonicalPath, '/benefits?page=2');
  assert.equal(getBenefitsSeoPolicy({ page: '3' }).canonicalPath, '/benefits?page=3');
  assert.equal(getBenefitsSeoPolicy({ page: '2' }).noIndex, false);
});

test('filtered benefit collection variants stay out of the index', () => {
  assert.equal(getBenefitsSeoPolicy({ q: 'coffee' }).noIndex, true);
  assert.equal(getBenefitsSeoPolicy({ carrier: 'SKT', grade: 'SKT_VIP' }).noIndex, true);
  assert.equal(getBenefitsSeoPolicy({ page: '2', category: '카페' }).noIndex, true);
  assert.equal(getBenefitsSeoPolicy({ page: 'bad' }).noIndex, true);
});

test('explicit Outback tiers beat a stale isAll row for every selected grade', () => {
  const tiers = [
    { carrier: 'SKT', grade: 'SKT_VIP', context: '15% 할인 또는 적립', isAll: true },
    { carrier: 'SKT', grade: 'SKT_SILVER', context: '5% 할인 또는 적립', isAll: false },
    { carrier: 'SKT', grade: 'SKT_GOLD', context: '15% 할인 또는 적립', isAll: false },
    { carrier: 'SKT', grade: 'SKT_VIP', context: '15% 할인 또는 적립', isAll: false },
  ];

  assert.deepEqual(
    getApplicableTierBenefits(tiers, 'SKT', 'SKT_SILVER').map((tier) => tier.context),
    ['5% 할인 또는 적립']
  );
  assert.deepEqual(
    getApplicableTierBenefits(tiers, 'SKT', 'SKT_VIP').map((tier) => tier.context),
    ['15% 할인 또는 적립']
  );
  assert.deepEqual(
    getApplicableTierBenefits(tiers, 'SKT')
      .map((tier) => tier.grade)
      .sort(),
    ['SKT_GOLD', 'SKT_SILVER', 'SKT_VIP']
  );
});

test('all-only contexts stay usable, including LGU VIP콕 applicability', () => {
  const allTier = [{ carrier: 'KT', grade: 'KT_VIP', context: '공통 혜택', isAll: true }];
  assert.deepEqual(getApplicableTierBenefits(allTier, 'KT', 'KT_GENERAL'), allTier);

  const vipCock = [{ carrier: 'LGU', grade: 'VIP콕', context: 'VIP콕 혜택', isAll: false }];
  assert.deepEqual(getApplicableTierBenefits(vipCock, 'LGU', 'VVIP'), vipCock);
});

test('all-grade and grade-specific contexts stay separate on the same benefit', () => {
  const tiers = [
    { carrier: 'SKT', grade: 'SKT_VIP', context: '모든 등급 공통', isAll: true },
    { carrier: 'SKT', grade: 'SKT_VIP', context: 'VIP 추가 혜택', isAll: false },
  ];

  assert.deepEqual(
    getApplicableTierBenefits(tiers, 'SKT', 'SKT_VIP').map((tier) => tier.context),
    ['모든 등급 공통', 'VIP 추가 혜택']
  );
  assert.deepEqual(
    getApplicableTierBenefits(tiers, 'SKT', 'SKT_SILVER').map((tier) => tier.context),
    ['모든 등급 공통']
  );
});
