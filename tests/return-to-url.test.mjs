import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  consumeOAuthReturnTo,
  consumeLoginIntent,
  getLoginHref,
  getLoginIntent,
  getSafeReturnTo,
  clearLoginNavigation,
  LOGIN_INTENT_KEY,
  LOGIN_RETURN_TO_KEY,
  migrateLoginIntent,
  OAUTH_RETURN_TO_KEY,
  prepareLoginNavigation,
  readLoginReturnTo,
  readOAuthReturnTo,
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

test('stores clean-login intent in the tab, consumes flags once, and retains target for refresh', () => {
  const values = new Map();
  globalThis.window = {
    sessionStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  };

  prepareLoginNavigation('/login?reset=1&notice=login-required&returnTo=%2Fmypage%2Ffavorites');
  assert.equal(values.get(LOGIN_RETURN_TO_KEY), '/mypage/favorites');
  assert.deepEqual(getLoginIntent(), { reset: true, notice: true });
  assert.equal(readLoginReturnTo(), '/mypage/favorites');
  prepareLoginNavigation('https://outside.example/login?returnTo=%2Fbenefits');
  assert.equal(readLoginReturnTo(), '/mypage/favorites');
  assert.deepEqual(consumeLoginIntent(), { reset: true, notice: true });
  assert.equal(consumeLoginIntent(), null);
  // A refresh retains the target after the one-shot UI flags are consumed.
  assert.equal(getLoginIntent(), null);
  assert.equal(readLoginReturnTo(), '/mypage/favorites');
  clearLoginNavigation(); // Successful login clears both pending and OAuth intent.
  assert.equal(values.has(LOGIN_RETURN_TO_KEY), false);
  assert.equal(values.has(OAUTH_RETURN_TO_KEY), false);
  delete globalThis.window;
});

test('replaces stale intent for a normal login entry and handles denied storage', () => {
  const values = new Map([
    [LOGIN_RETURN_TO_KEY, '/mypage/favorites'],
    [OAUTH_RETURN_TO_KEY, '/benefits'],
  ]);
  globalThis.window = {
    sessionStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  };
  prepareLoginNavigation('/login?reset=1&returnTo=%2F');
  assert.equal(readLoginReturnTo(), '/');
  assert.equal(getLoginIntent()?.reset, true);
  assert.equal(values.has(OAUTH_RETURN_TO_KEY), false);
  prepareLoginNavigation('/login');
  assert.equal(readLoginReturnTo(), '/');
  assert.deepEqual(getLoginIntent(), { reset: true, notice: false });

  clearLoginNavigation();
  globalThis.window = {
    get sessionStorage() {
      throw new Error('storage disabled');
    },
  };
  assert.equal(readLoginReturnTo('/benefits'), '/benefits');
  assert.equal(prepareLoginNavigation('/login?returnTo=%2Fmypage%2Ffavorites'), undefined);
  delete globalThis.window;
});

test('validates stored login destinations on every read', () => {
  globalThis.window = {
    sessionStorage: {
      getItem: () => '//outside.example/path',
      setItem() {},
      removeItem() {},
    },
  };
  clearLoginNavigation();
  assert.equal(readLoginReturnTo(), '/');
  delete globalThis.window;
});

test('keeps module memory client-only during SSR', async () => {
  delete globalThis.window;
  const serverUtility = await import('../src/features/loginPage/utils/returnTo.mjs?server-only=1');
  serverUtility.migrateLoginIntent('/benefits', { reset: true, notice: true });
  serverUtility.prepareLoginNavigation('/login?returnTo=%2Fbenefits');

  globalThis.window = { sessionStorage: { getItem: () => null } };
  assert.equal(serverUtility.readLoginReturnTo('/profile'), '/profile');
  assert.equal(serverUtility.getLoginIntent(), null);
  delete globalThis.window;
});

test('storage method failures still deliver same-tab intent and clear memory cleanly', () => {
  const events = [];
  globalThis.window = {
    get sessionStorage() {
      return {
        getItem() { throw new Error('read denied'); },
        setItem() { throw new Error('write denied'); },
        removeItem() { throw new Error('remove denied'); },
      };
    },
    dispatchEvent: (event) => events.push(event.type),
  };

  prepareLoginNavigation('/login?notice=login-required&returnTo=%2Fbenefits');
  assert.deepEqual(events, ['itplace:login-intent']);
  assert.equal(readLoginReturnTo(), '/benefits');
  assert.deepEqual(getLoginIntent(), { reset: true, notice: true });
  prepareLoginNavigation('/login?notice=login-required');
  assert.deepEqual(getLoginIntent(), { reset: true, notice: true });
  assert.equal(readLoginReturnTo(), '/');
  clearLoginNavigation();
  assert.equal(readLoginReturnTo('/profile'), '/profile');
  assert.equal(getLoginIntent(), null);
  assert.equal(storeOAuthReturnTo('/mypage/favorites'), false);
  assert.equal(consumeOAuthReturnTo(), '/mypage/favorites');
  delete globalThis.window;
});

test('latest in-memory entry overrides stale readable storage when writes and removals fail', () => {
  const values = new Map([
    [LOGIN_RETURN_TO_KEY, '/mypage/favorites'],
    [OAUTH_RETURN_TO_KEY, '/map'],
    [LOGIN_INTENT_KEY, JSON.stringify({ reset: false, notice: true })],
  ]);
  globalThis.window = {
    sessionStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem() { throw new Error('write denied'); },
      removeItem() { throw new Error('remove denied'); },
    },
    dispatchEvent() {},
  };

  prepareLoginNavigation('/login');
  assert.equal(readLoginReturnTo(), '/');
  assert.equal(readOAuthReturnTo(), '/');
  assert.deepEqual(consumeLoginIntent(), { reset: true, notice: false });
  assert.equal(consumeLoginIntent(), null);
  delete globalThis.window;
});

test('legacy returnTo migration supersedes an abandoned OAuth destination', () => {
  const values = new Map();
  globalThis.window = {
    sessionStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  };
  assert.equal(storeOAuthReturnTo('/map'), true);
  migrateLoginIntent('/mypage/favorites', { reset: true });
  assert.equal(readLoginReturnTo(), '/mypage/favorites');
  assert.equal(readOAuthReturnTo(readLoginReturnTo()), '/mypage/favorites');
  assert.equal(values.has(OAUTH_RETURN_TO_KEY), false);
  clearLoginNavigation();
  delete globalThis.window;
});
