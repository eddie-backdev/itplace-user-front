const OAUTH_PRE_AUTH_STORAGE_KEY = 'itplace:oauth-pre-auth';
const OAUTH_PRE_AUTH_TTL_MS = 5 * 60 * 1000;

export type OAuthPreAuthPayload = {
  email: string;
  nickname: string;
};

export const storeOAuthPreAuth = (payload: OAuthPreAuthPayload) => {
  try {
    window.sessionStorage.setItem(
      OAUTH_PRE_AUTH_STORAGE_KEY,
      JSON.stringify({ ...payload, expiresAt: Date.now() + OAUTH_PRE_AUTH_TTL_MS })
    );
    return true;
  } catch {
    return false;
  }
};

export const consumeOAuthPreAuth = (): OAuthPreAuthPayload | null => {
  try {
    const serialized = window.sessionStorage.getItem(OAUTH_PRE_AUTH_STORAGE_KEY);
    window.sessionStorage.removeItem(OAUTH_PRE_AUTH_STORAGE_KEY);
    if (!serialized) return null;

    const payload = JSON.parse(serialized) as Partial<OAuthPreAuthPayload> & {
      expiresAt?: number;
    };
    if (typeof payload.expiresAt !== 'number' || payload.expiresAt < Date.now()) return null;
    return {
      email: typeof payload.email === 'string' ? payload.email : '',
      nickname: typeof payload.nickname === 'string' ? payload.nickname : '',
    };
  } catch {
    return null;
  }
};
