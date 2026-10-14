const APP_ORIGIN = 'https://itplace.invalid';
export const OAUTH_RETURN_TO_KEY = 'itplace.oauthReturnTo';

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

export function storeOAuthReturnTo(returnTo) {
  try {
    window.sessionStorage.setItem(OAUTH_RETURN_TO_KEY, getSafeReturnTo(returnTo));
    return true;
  } catch {
    return false;
  }
}

export function consumeOAuthReturnTo(fallback = '/') {
  try {
    const stored = window.sessionStorage.getItem(OAUTH_RETURN_TO_KEY);
    window.sessionStorage.removeItem(OAUTH_RETURN_TO_KEY);
    return getSafeReturnTo(stored, getSafeReturnTo(fallback));
  } catch {
    return getSafeReturnTo(fallback);
  }
}

export function clearOAuthReturnTo() {
  try {
    window.sessionStorage.removeItem(OAUTH_RETURN_TO_KEY);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}
