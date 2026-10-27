export function canLoadGoogleAnalytics(input: {
  environment: string | undefined;
  hostname: string;
  measurementId: string | undefined;
}): boolean;
export function isOAuthCallback(pathname: string): boolean;
export function getPageContext(input: {
  origin: string;
  pathname: string;
  referrer: string;
}): { page_location: string; page_referrer: string };
export function createGoogleAnalyticsTracker(
  measurementId: string,
  send: (...args: unknown[]) => void
): (input: {
  pathname: string;
  pageContext: { page_location: string; page_referrer: string };
}) => boolean;
