import assert from 'node:assert/strict';
import test from 'node:test';
import { getApplicableTierBenefits } from '../src/features/allBenefitsPage/apis/tierBenefitResolver.mjs';
import { getScopedBenefitHeadline } from '../src/screens/partnerBenefitHeadline.mjs';

const discount = {
  type: 'DISCOUNT_RATE', value: 20, unit: 'PERCENT', qualifier: 'EXACT', sourceText: '20% 할인',
};

test('a validated reward fact replaces a generic offer label and keeps discount semantics', () => {
  assert.equal(
    getScopedBenefitHeadline({
      offers: [{ title: '할인형', facts: [discount] }],
      offerResolution: 'SINGLE',
      eligibleTierContexts: ['2시간 패스 평일 20% 할인'],
    }),
    '20% 할인'
  );
});

test('a single generic offer can use only its already eligible grade context', () => {
  assert.equal(
    getScopedBenefitHeadline({
      offers: [{ title: '혜택 내용', facts: [] }],
      offerResolution: 'PARTIAL',
      eligibleTierContexts: ['VIP/GOLD/SILVER: 2시간 패스 평일 20% 할인'],
    }),
    'VIP/GOLD/SILVER: 2시간 패스 평일 20% 할인'
  );
  assert.equal(
    getScopedBenefitHeadline({
      offers: [{ title: '할인형', facts: [] }],
      offerResolution: 'SINGLE',
    }),
    '선택 등급의 적용 혜택을 확인해 주세요'
  );
  assert.equal(
    getScopedBenefitHeadline({
      offers: [{ title: '혜택 내용', facts: [] }],
      offerResolution: 'UNRESOLVED',
      eligibleTierContexts: ['VIP 조건'],
    }),
    '선택 등급의 적용 혜택을 확인해 주세요'
  );
});

test('generic offer fallback uses only the selected SKT grade context', () => {
  const tiers = ['VIP', 'GOLD', 'SILVER'].map((grade) => ({
    carrier: 'SKT',
    grade: `SKT_${grade}`,
    context: `${grade}: 2시간 패스 평일 20% 할인`,
    isAll: false,
  }));

  for (const grade of ['VIP', 'GOLD', 'SILVER']) {
    const eligibleTierContexts = getApplicableTierBenefits(tiers, 'SKT', `SKT_${grade}`).map(
      ({ context }) => context
    );
    assert.deepEqual(eligibleTierContexts, [`${grade}: 2시간 패스 평일 20% 할인`]);
    assert.equal(
      getScopedBenefitHeadline({
        offers: [{ title: '할인형', facts: [] }],
        offerResolution: 'PARTIAL',
        eligibleTierContexts,
      }),
      `${grade}: 2시간 패스 평일 20% 할인`
    );
  }
  assert.equal(
    getScopedBenefitHeadline({
      offers: [{ title: '적립형', facts: [] }],
      offerResolution: 'PARTIAL',
      eligibleTierContexts: ['2시간 패스 평일 20% 할인'],
    }),
    '2시간 패스 평일 20% 할인'
  );
});

test('a single carrier-branded offer without reward facts prefers its eligible tier description', () => {
  assert.equal(
    getScopedBenefitHeadline({
      offers: [
        {
          title: '스몹 KT 멤버십',
          facts: [
            { type: 'USAGE_LIMIT', value: 2, unit: 'COUNT', qualifier: 'MAX', sourceText: '연 2회' },
          ],
        },
      ],
      offerResolution: 'PARTIAL',
      eligibleTierContexts: ['스몹 평일 입장권 20% 할인'],
    }),
    '스몹 평일 입장권 20% 할인'
  );
});

test('multiple offers retain known reward types without borrowing a shared tier context', () => {
  assert.equal(
    getScopedBenefitHeadline({
      offers: [
        { title: '할인형', facts: [discount] },
        { title: '적립형', facts: [{ ...discount, type: 'REWARD_RATE', sourceText: '20% 적립' }] },
      ],
      offerResolution: 'SCOPED',
      eligibleTierContexts: ['VIP 혜택 내용을 참고하세요'],
    }),
    '20% 할인 · 20% 적립'
  );
});

test('an unscoped generic offer does not hide unknown reward details', () => {
  assert.equal(
    getScopedBenefitHeadline({
      offers: [{ title: '할인형', facts: [] }, { title: '혜택 내용', facts: [] }],
      offerResolution: 'PARTIAL',
      eligibleTierContexts: ['VIP 조건'],
    }),
    '선택 등급의 적용 혜택을 확인해 주세요'
  );
  assert.equal(
    getScopedBenefitHeadline({
      offers: [
        { title: '혜택 내용', facts: [discount] },
        { title: '혜택 내용', facts: [] },
      ],
      offerResolution: 'PARTIAL',
    }),
    '20% 할인 · 일부 혜택 내용은 확인되지 않았어요'
  );
});
