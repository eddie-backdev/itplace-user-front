import test from 'node:test';
import assert from 'node:assert/strict';
import { getBenefitRefreshState } from '../src/features/allBenefitsPage/apis/benefitRefreshState.mjs';

test('refresh keeps prior results locked while loading', () => {
  assert.deepEqual(getBenefitRefreshState(true, 'loading', false), {
    hasStaleResults: true,
    isRefreshing: true,
    resultsLocked: true,
  });
});

test('failed refresh exposes retry state while keeping prior results locked', () => {
  assert.deepEqual(getBenefitRefreshState(true, 'error', false), {
    hasStaleResults: true,
    isRefreshing: false,
    resultsLocked: true,
  });
});

test('current results are interactive after success', () => {
  assert.deepEqual(getBenefitRefreshState(true, 'ready', true), {
    hasStaleResults: false,
    isRefreshing: false,
    resultsLocked: false,
  });
});

test('first load shows skeleton without pretending prior results exist', () => {
  assert.deepEqual(getBenefitRefreshState(false, 'loading', false), {
    hasStaleResults: false,
    isRefreshing: false,
    resultsLocked: false,
  });
});
