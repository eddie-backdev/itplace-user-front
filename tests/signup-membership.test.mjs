import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getSignupMembershipPayload,
  isSignupMembershipValid,
  OPTIONAL_SIGNUP_CARRIER,
} from '../src/features/loginPage/utils/signupMembership.mjs';

const validPairs = new Map([
  ['SKT', new Set(['SKT_SILVER', 'SKT_GOLD', 'SKT_VIP'])],
  ['KT', new Set(['KT_GENERAL', 'KT_WHITE', 'KT_SILVER', 'KT_GOLD', 'KT_VIP', 'KT_VVIP'])],
]);
const isValidPair = (carrier, grade) => validPairs.get(carrier)?.has(grade) ?? false;

test('requires an explicit carrier choice and a matching grade unless membership is skipped', () => {
  assert.equal(isSignupMembershipValid('', '', isValidPair), false);
  assert.equal(isSignupMembershipValid('SKT', '', isValidPair), false);
  assert.equal(isSignupMembershipValid('', 'SKT_VIP', isValidPair), false);
  assert.equal(isSignupMembershipValid('SKT', 'KT_VIP', isValidPair), false);
  assert.equal(isSignupMembershipValid('SKT', 'SKT_VIP', isValidPair), true);
  assert.equal(isSignupMembershipValid(OPTIONAL_SIGNUP_CARRIER, '', isValidPair), true);
});

test('serializes the explicit skip choice as a null pair and never sends its UI sentinel', () => {
  const skippedPayload = getSignupMembershipPayload(OPTIONAL_SIGNUP_CARRIER, 'SKT_VIP');
  assert.deepEqual(skippedPayload, { carrier: null, membershipGradeCode: null });
  assert.equal(Object.values(skippedPayload).includes(OPTIONAL_SIGNUP_CARRIER), false);

  assert.deepEqual(getSignupMembershipPayload('SKT', 'SKT_VIP'), {
    carrier: 'SKT',
    membershipGradeCode: 'SKT_VIP',
  });
});

test('accepts MVNO signup without membership grade and drops any stale grade from the payload', () => {
  assert.equal(isSignupMembershipValid('MVNO', '', isValidPair), true);
  assert.equal(isSignupMembershipValid('MVNO', 'SKT_VIP', isValidPair), true);
  assert.deepEqual(getSignupMembershipPayload('MVNO', ''), {
    carrier: 'MVNO',
    membershipGradeCode: null,
  });
  assert.deepEqual(getSignupMembershipPayload('MVNO', 'SKT_VIP'), {
    carrier: 'MVNO',
    membershipGradeCode: null,
  });
});
