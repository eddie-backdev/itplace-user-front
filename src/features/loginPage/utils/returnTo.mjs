const APP_ORIGIN = 'https://itplace.invalid';
export const OAUTH_RETURN_TO_KEY = 'itplace.oauthReturnTo';
export const LOGIN_INTENT_KEY = 'itplace.loginIntent';
export const LOGIN_RETURN_TO_KEY = 'itplace.loginReturnTo';
let memoryLoginReturnTo;
let memoryOAuthReturnTo;
let memoryLoginIntent;

const hasControlCharacter = /[\u0000-\u001f\u007f]/;
const hasEncodedControlCharacter = /%(?:0[0-9a-f]|1[0-9a-f]|7f)/i;
const hasEncodedPathSeparator = /%(?:2f|5c)/i;

export function getSafeReturnTo(value, fallback = '/') {
  const safeFallback = fallback === value ? '/' : getSafeReturnTo(fallback, '/');
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return safeFallback;
  }
  if (value.includes('\\') || hasControlCharacter.test(value)) return safeFallback;

  try {
    const url = new URL(value, APP_ORIGIN);
    if (url.origin !== APP_ORIGIN) return safeFallback;

    const path = url.pathname;
    if (hasEncodedPathSeparator.test(path) || hasEncodedControlCharacter.test(path)) {
      return safeFallback;
    }

    let decodedPath = path;
    while (true) {
      if (
        hasEncodedPathSeparator.test(decodedPath) ||
        hasEncodedControlCharacter.test(decodedPath)
      ) {
        return safeFallback;
      }
      const decoded = decodeURIComponent(decodedPath);
      if (decoded === decodedPath) break;
      decodedPath = decoded;
    }

    if (
      hasControlCharacter.test(decodedPath) ||
      decodedPath.includes('\\') ||
      decodedPath.startsWith('//')
    ) {
      return safeFallback;
    }
    if (/^\/(?:login|oauth\/callback)(?:\/|$)/i.test(decodedPath)) return safeFallback;

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return safeFallback;
  }
}

export function getLoginHref(returnTo) {
  return `/login?reset=1&returnTo=${encodeURIComponent(getSafeReturnTo(returnTo))}`;
}

function getStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

const isClient = () => typeof window !== 'undefined';

function readStored(key) {
  try {
    return getStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function prepareLoginNavigation(href) {
  if (!isClient()) return;
  try {
    const url = new URL(href, APP_ORIGIN);
    if (url.origin !== APP_ORIGIN || url.pathname !== '/login') return;
    if ((url.searchParams.has('step') || url.searchParams.has('oauth')) && !url.searchParams.has('returnTo')) return;
    memoryLoginReturnTo = getSafeReturnTo(url.searchParams.get('returnTo'));
    memoryOAuthReturnTo = null;
    memoryLoginIntent = {
      reset: true,
      notice: url.searchParams.get('notice') === 'login-required',
    };
    try {
      const storage = getStorage();
      storage?.setItem(LOGIN_RETURN_TO_KEY, memoryLoginReturnTo);
      storage?.removeItem(OAUTH_RETURN_TO_KEY);
      storage?.setItem(LOGIN_INTENT_KEY, JSON.stringify(memoryLoginIntent));
    } catch {
      // The in-memory intent still serves same-tab navigation.
    }
    window.dispatchEvent?.(new Event('itplace:login-intent'));
  } catch {
    // Invalid destinations are ignored.
  }
}

export function getLoginIntent() {
  const raw = isClient() && memoryLoginIntent !== undefined
    ? memoryLoginIntent && JSON.stringify(memoryLoginIntent)
    : readStored(LOGIN_INTENT_KEY);
  if (!raw) return null;
  try {
    const intent = JSON.parse(raw);
    return { reset: intent?.reset === true, notice: intent?.notice === true };
  } catch {
    return null;
  }
}

export function readOAuthReturnTo(fallback = '/') {
  const value = isClient() && memoryOAuthReturnTo !== undefined
    ? memoryOAuthReturnTo
    : readStored(OAUTH_RETURN_TO_KEY);
  return getSafeReturnTo(value, fallback);
}

export function readLoginReturnTo(fallback = '/') {
  const value = isClient() && memoryLoginReturnTo !== undefined
    ? memoryLoginReturnTo
    : readStored(LOGIN_RETURN_TO_KEY);
  return getSafeReturnTo(value, fallback);
}

export function migrateLoginIntent(returnTo, flags = {}) {
  if (!isClient()) return;
  memoryLoginReturnTo = getSafeReturnTo(returnTo);
  memoryOAuthReturnTo = null;
  memoryLoginIntent = { reset: flags.reset === true, notice: flags.notice === true };
  clearOAuthReturnTo();
  try {
    const storage = getStorage();
    storage?.setItem(LOGIN_RETURN_TO_KEY, memoryLoginReturnTo);
    storage?.setItem(LOGIN_INTENT_KEY, JSON.stringify(memoryLoginIntent));
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

export function consumeLoginIntent() {
  const intent = getLoginIntent();
  clearLoginIntent();
  return intent;
}

export function clearLoginIntent() {
  if (isClient()) memoryLoginIntent = null;
  try {
    getStorage()?.removeItem(LOGIN_INTENT_KEY);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

export function clearLoginNavigation() {
  if (isClient()) {
    memoryLoginReturnTo = null;
    memoryOAuthReturnTo = null;
  }
  clearOAuthReturnTo();
  clearLoginIntent();
  try {
    getStorage()?.removeItem(LOGIN_RETURN_TO_KEY);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

export function storeOAuthReturnTo(returnTo) {
  try {
    const storage = getStorage();
    if (!storage) return false;
    const safeReturnTo = getSafeReturnTo(returnTo);
    memoryOAuthReturnTo = safeReturnTo;
    memoryLoginReturnTo = safeReturnTo;
    memoryLoginIntent = { reset: false, notice: false };
    storage.setItem(OAUTH_RETURN_TO_KEY, safeReturnTo);
    storage.setItem(LOGIN_RETURN_TO_KEY, safeReturnTo);
    storage.setItem(LOGIN_INTENT_KEY, JSON.stringify(memoryLoginIntent));
    return true;
  } catch {
    return false;
  }
}

export function consumeOAuthReturnTo(fallback = '/') {
  const stored = isClient() && memoryOAuthReturnTo !== undefined
    ? memoryOAuthReturnTo
    : readStored(OAUTH_RETURN_TO_KEY);
  if (isClient()) {
    memoryOAuthReturnTo = null;
    memoryLoginReturnTo = null;
  }
  try {
    const storage = getStorage();
    storage?.removeItem(OAUTH_RETURN_TO_KEY);
    storage?.removeItem(LOGIN_RETURN_TO_KEY);
  } catch {
    // Return the validated in-memory target even when removal is blocked.
  }
  clearLoginIntent();
  return getSafeReturnTo(stored, getSafeReturnTo(fallback));
}

export function clearOAuthReturnTo() {
  if (isClient()) memoryOAuthReturnTo = null;
  try {
    getStorage()?.removeItem(OAUTH_RETURN_TO_KEY);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}
