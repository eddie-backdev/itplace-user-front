import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getCarrierBenefitDisplayName,
  getMembershipOptionLabel,
  getSourceOptionLabel,
} from '../src/features/allBenefitsPage/apis/benefitDisplay.mjs';

const benefit = (overrides = {}) => ({ benefitName: 'GS25 멤버십 혜택 · 할인형', ...overrides });

test('common detail titles prefer displayName and fall back for rolling deploys', () => {
  assert.equal(
    getCarrierBenefitDisplayName(benefit({ displayName: ' GS25 멤버십 혜택 ' })),
    'GS25 멤버십 혜택'
  );
  assert.equal(getCarrierBenefitDisplayName(benefit()), 'GS25 멤버십 혜택 · 할인형');
});

test('only known membership option types become choice labels', () => {
  assert.equal(getMembershipOptionLabel(benefit({ membershipOptionType: 'DISCOUNT' })), '할인형');
  assert.equal(
    getMembershipOptionLabel(benefit({ membershipOptionType: 'POINT_ACCRUAL' })),
    '적립형'
  );
  for (const membershipOptionType of ['NOT_APPLICABLE', 'UNKNOWN', undefined]) {
    assert.equal(getMembershipOptionLabel(benefit({ membershipOptionType })), null);
  }
});

test('source option labels remain separate text and are omitted when redundant', () => {
  assert.equal(
    getSourceOptionLabel(
      benefit({ membershipOptionType: 'DISCOUNT', sourceOptionLabel: '  멤버십 할인  ' })
    ),
    '멤버십 할인'
  );
  assert.equal(
    getSourceOptionLabel(
      benefit({ membershipOptionType: 'DISCOUNT', sourceOptionLabel: '할인형' })
    ),
    null
  );
  assert.equal(
    getSourceOptionLabel(
      benefit({ membershipOptionType: 'UNKNOWN', sourceOptionLabel: '<b>원문</b>' })
    ),
    '<b>원문</b>'
  );
});
