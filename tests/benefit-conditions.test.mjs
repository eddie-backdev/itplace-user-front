import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatSourceCapturedDate,
  getBenefitOfferEligibility,
  getBenefitOffers,
  hasOverallBenefitSummaryContent,
  getSingleOfferRewardSummary,
  getBenefitConditionRows,
  partitionBenefitOffers,
} from '../src/features/allBenefitsPage/apis/benefitConditions.mjs';
import {
  getEffectiveBenefitUsageType,
  hasKnownStores,
} from '../src/features/allBenefitsPage/apis/benefitChannelFacts.mjs';
import { formatOfferFact, formatOfferFacts, formatOfferRewardFacts } from '../src/features/allBenefitsPage/apis/benefitFactFormatting.mjs';

test('common benefit facts keep the agreed label order and use one compact unknown value', () => {
  const rows = getBenefitConditionRows({});

  assert.deepEqual(
    rows.map(({ label }) => label),
    ['혜택', '적용 등급', '대상 상품', '이용 가능일', '이용 한도', '이용 방법', '제외 조건']
  );
  assert.ok(rows.every(({ values, isUnknown }) => values[0] === '공식 안내에서 확인' && isUnknown));
});

test('source tier text and old limit values remain usable without claiming unlimited use', () => {
  const rows = getBenefitConditionRows(
    { products: ['GS25 전체 상품'], availability: ['매일'] },
    '월 1회'
  );

  assert.deepEqual(rows[0], {
    key: 'benefit',
    label: '혜택',
    values: ['공식 안내에서 확인'],
    isUnknown: true,
  });
  assert.equal(rows[2].values[0], 'GS25 전체 상품');
  assert.equal(rows[3].values[0], '매일');
  assert.equal(rows[4].values[0], '월 1회');
  assert.equal(getBenefitConditionRows({}, '제한없음')[4].values[0], '공식 안내에서 확인');
  assert.equal(getBenefitConditionRows({}, '제한없음')[4].isUnknown, true);
  assert.equal(getBenefitConditionRows({}, '이용 방법에서 횟수·한도 확인')[4].isUnknown, true);
});

test('tier labels and carrier channel unknowns stay explicit', () => {
  const rows = getBenefitConditionRows({}, null, [
    { context: '1+1 상품 구매 시', grades: ['VIP', 'VVIP'] },
  ]);

  assert.deepEqual(
    rows.slice(0, 2).map(({ label, values }) => [label, values]),
    [
      ['혜택', ['1+1 상품 구매 시']],
      ['적용 등급', ['VIP', 'VVIP']],
    ]
  );
  for (const partnerId of [131, 112, 288]) {
    for (const usageType of ['ONLINE', 'OFFLINE', 'BOTH', 'UNKNOWN']) {
      assert.equal(getEffectiveBenefitUsageType(partnerId, 'SKT', usageType), usageType);
    }
    assert.equal(getEffectiveBenefitUsageType(partnerId, 'SKT', null), 'UNKNOWN');
  }
  assert.equal(getEffectiveBenefitUsageType(1, 'SKT', 'UNKNOWN'), 'UNKNOWN');
  assert.equal(getEffectiveBenefitUsageType(1, 'SKT', 'BOTH'), 'BOTH');
});

test('scoped offers remain separate and retain their own channel and eligibility', () => {
  const onlineTicket = {
    key: 'online-ticket',
    title: '온라인 영화 예매',
    sourceText: '온라인 전용',
    usageType: 'ONLINE',
    gradeCodes: ['VIP'],
    allGrades: false,
  };
  const storeCombo = {
    key: 'store-combo',
    title: '매장 콤보',
    sourceText: '매장에서 이용',
    usageType: 'OFFLINE',
    gradeCodes: ['GOLD'],
    allGrades: false,
  };
  const offers = getBenefitOffers({ offers: [onlineTicket, storeCombo] });

  assert.deepEqual(
    offers.map(({ title, usageType, gradeCodes }) => [title, usageType, gradeCodes]),
    [
      ['온라인 영화 예매', 'ONLINE', ['VIP']],
      ['매장 콤보', 'OFFLINE', ['GOLD']],
    ]
  );
  assert.equal(getBenefitOffers({ offers: [{ key: '  ' }, null] }).length, 0);
});

test('store CTA availability follows only the authoritative store-presence flag', () => {
  assert.equal(hasKnownStores(true), true);
  assert.equal(hasKnownStores(false), false);
  assert.equal(hasKnownStores(undefined), false);
  assert.equal(hasKnownStores(null), false);
});

test('fact labels collapse duplicate source evidence without changing facts or distinct periods', () => {
  const facts = [
    { type: 'USAGE_LIMIT', value: 1, unit: 'COUNT', period: 'DAY', sourcePath: 'row/1' },
    { type: 'USAGE_LIMIT', value: 1, unit: 'COUNT', period: 'DAY', sourcePath: 'row/2' },
    { type: 'USAGE_LIMIT', value: 1, unit: 'COUNT', period: 'MONTH', sourcePath: 'row/3' },
  ];

  assert.deepEqual(formatOfferFacts(facts), ['1회/일', '1회/월']);
  assert.equal(facts.length, 3);
  assert.deepEqual(facts.map(({ sourcePath }) => sourcePath), ['row/1', 'row/2', 'row/3']);
});

test('reward headline facts retain maximum and basis but exclude thresholds and limits', () => {
  assert.deepEqual(formatOfferRewardFacts([
    { type: 'DISCOUNT_AMOUNT', value: 50, basisAmount: 1000, basisUnit: 'KRW', qualifier: 'MAX' },
    { type: 'MIN_SPEND', value: 5000, qualifier: 'MIN' },
    { type: 'SPEND_CAP', value: 10000, qualifier: 'MAX' },
    { type: 'USAGE_LIMIT', value: 1, unit: 'COUNT', period: 'DAY', qualifier: 'MAX' },
  ]), ['최대 50원 할인 (1,000원당)']);
});

test('ratio rewards retain their basis and card-specific scope', () => {
  const sourceText = 'V G 천원당 150원 할인(모바일카드) / 천원당 50원 할인(플라스틱카드)';
  const pointsSource = 'V G 천원당 100P 적립(모바일카드) / 천원당 50P 적립(플라스틱카드)';
  assert.deepEqual(formatOfferRewardFacts([
    { type: 'DISCOUNT_AMOUNT', value: 150, basisAmount: 1000, basisUnit: 'KRW', sourceText },
    { type: 'DISCOUNT_AMOUNT', value: 50, basisAmount: 1000, basisUnit: 'KRW', sourceText },
    { type: 'REWARD_POINTS', value: 100, unit: 'POINT', basisAmount: 1000, basisUnit: 'KRW', sourceText: pointsSource },
  ]), [
    '150원 할인 (1,000원당) · 모바일카드',
    '50원 할인 (1,000원당) · 플라스틱카드',
    '100포인트 적립 (1,000원당) · 모바일카드',
  ]);
  assert.equal(formatOfferFact({
    type: 'DISCOUNT_AMOUNT', value: 150, basisAmount: 1000, basisUnit: 'KRW', sourceText,
  }), '150원 할인 (1,000원당) · 모바일카드');
  assert.equal(formatOfferFact({
    type: 'DISCOUNT_AMOUNT', value: 50, basisAmount: 1000, basisUnit: 'KRW',
    sourceText: 'S 천원당 50원 할인(모바일카드/플라스틱카드)',
  }), '50원 할인 (1,000원당) · 모바일카드/플라스틱카드');
  assert.equal(formatOfferFact({
    type: 'DISCOUNT_AMOUNT', value: 50, basisAmount: 1000, basisUnit: 'KRW',
    sourceText: '천원당 50원 할인 · 모바일카드 이용 시',
  }), '50원 할인 (1,000원당)');
  assert.equal(formatOfferFact({ type: 'MIN_SPEND', value: 5000, sourceText: '모바일카드 천원당 50원 할인' }),
    '5,000원 이상 결제');
});

test('overall summary accordion requires displayable rows or channel evidence', () => {
  assert.equal(hasOverallBenefitSummaryContent([], { version: 'v1', reason: 'FROM_SOURCE', evidence: [], exclusions: [] }), false);
  assert.equal(hasOverallBenefitSummaryContent([], { version: 'v1', reason: 'FROM_SOURCE', evidence: ['매장 결제'], exclusions: [] }), true);
  assert.equal(hasOverallBenefitSummaryContent([{}], { version: 'v1', reason: 'FROM_SOURCE', evidence: [], exclusions: [] }), true);
});

test('selected-grade offer partition hides known nonmatches and keeps unknown eligibility explicit', () => {
  const allGrades = { key: 'all', allGrades: true, gradeCodes: [] };
  const scoped = { key: 'scoped', allGrades: false, gradeCodes: ['VIP'] };
  const unknown = { key: 'unknown', allGrades: null, gradeCodes: [] };
  const eligibility = (offer) =>
    getBenefitOfferEligibility(offer, true, offer.key === 'scoped');
  const partition = partitionBenefitOffers([allGrades, scoped, unknown], eligibility);

  assert.deepEqual(partition.visible.map(({ key }) => key), ['all', 'scoped', 'unknown']);
  assert.equal(getBenefitOfferEligibility(scoped, true, false), 'INELIGIBLE');
  assert.equal(getBenefitOfferEligibility(unknown, true, false), 'UNKNOWN');
  assert.equal(getBenefitOfferEligibility(unknown, false, false), 'UNKNOWN');
  assert.equal(getBenefitOfferEligibility(allGrades, false, false), 'ELIGIBLE');
  assert.equal(getBenefitOfferEligibility(allGrades, true, true, 'UNRESOLVED'), 'UNKNOWN');

  const unmatched = partitionBenefitOffers([scoped], () => 'INELIGIBLE');
  assert.deepEqual(unmatched.visible, []);
  assert.deepEqual(unmatched.otherGrades, [scoped]);
  assert.deepEqual(partitionBenefitOffers([scoped], () => 'INELIGIBLE', true), {
    visible: [scoped],
    otherGrades: [],
  });
});

test('capture dates render only when the API provides a valid UTC timestamp', () => {
  assert.equal(formatSourceCapturedDate('2026-10-18T15:30:00Z'), '2026. 10. 19.');
  assert.equal(formatSourceCapturedDate(undefined), null);
  assert.equal(formatSourceCapturedDate('not-a-date'), null);
});


test('SINGLE offer does not promote parent description when selected grade has no reward tier', () => {
  const vvipOnlyDescription = [{ grades: [], context: 'VVIP 등급 뮤지컬·전시 최대 50% 할인 및 공연 무료 초대' }];
  assert.equal(
    getSingleOfferRewardSummary('SINGLE', 1, true, vvipOnlyDescription),
    undefined
  );
  assert.equal(
    getSingleOfferRewardSummary('SINGLE', 1, true, [
      { grades: ['White'], context: '상시 혜택' },
    ]),
    '상시 혜택'
  );
});
