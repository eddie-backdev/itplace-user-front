import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  consumeOAuthReturnTo,
  getLoginHref,
  getSafeReturnTo,
  OAUTH_RETURN_TO_KEY,
  storeOAuthReturnTo,
} from '../src/features/loginPage/utils/returnTo.mjs';

test('accepts internal paths and preserves query and hash', () => {
  assert.equal(
    getSafeReturnTo('/mypage/favorites?sort=recent#saved'),
    '/mypage/favorites?sort=recent#saved'
  );
  assert.equal(
    getLoginHref('/mypage/favorites?sort=recent#saved'),
    '/login?reset=1&returnTo=%2Fmypage%2Ffavorites%3Fsort%3Drecent%23saved'
  );
});

test('rejects external, malformed, auth-loop, and encoded path tricks', () => {
  for (const value of [
    'https://outside.example/path',
    '//outside.example/path',
    '/\\\\outside.example/path',
    '/\nlogin',
    '/%2f%2foutside.example/path',
    '/safe/%252f%252foutside.example/path',
    '/safe/%2525252f/path',
    '/%255c%255coutside.example/path',
    '/%250a/login',
    '/safe/%250a/path',
    '/login?returnTo=/benefits',
    '/oauth/callback/kakao',
  ]) {
    assert.equal(getSafeReturnTo(value), '/', value);
  }
});

test('keeps encoded query data while checking the resolved URL origin', () => {
  assert.equal(
    getSafeReturnTo('/search?returnTo=%2F%2Foutside.example%2Fbenefits&token=a%2Fb'),
    '/search?returnTo=%2F%2Foutside.example%2Fbenefits&token=a%2Fb'
  );
  assert.equal(getSafeReturnTo('/%2F%2Foutside.example/path'), '/');
});

test('consumes OAuth return path once and validates stored values', () => {
  const values = new Map();
  globalThis.window = {
    sessionStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  };

  assert.equal(storeOAuthReturnTo('/mypage/info?tab=membership'), true);
  assert.equal(values.get(OAUTH_RETURN_TO_KEY), '/mypage/info?tab=membership');
  assert.equal(consumeOAuthReturnTo(), '/mypage/info?tab=membership');
  assert.equal(consumeOAuthReturnTo('/benefits'), '/benefits');

  storeOAuthReturnTo('https://outside.example/');
  assert.equal(consumeOAuthReturnTo(), '/');
  delete globalThis.window;
});
