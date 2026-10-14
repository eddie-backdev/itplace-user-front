export const OAUTH_RETURN_TO_KEY: string;
export function getSafeReturnTo(value: unknown, fallback?: string): string;
export function getLoginHref(returnTo: unknown): string;
export function storeOAuthReturnTo(returnTo: unknown): boolean;
export function consumeOAuthReturnTo(fallback?: string): string;
export function clearOAuthReturnTo(): void;
