export function canLoadGoogleAnalytics({ environment, hostname, measurementId }) {
  return (
    environment === 'production' &&
    ['itplace.click', 'www.itplace.click'].includes(hostname) &&
    /^G-[A-Z0-9]+$/.test(measurementId ?? '')
  );
}

export function isOAuthCallback(pathname) {
  const cleanPathname = pathname.split(/[?#]/, 1)[0];
  return cleanPathname === '/oauth/callback' || cleanPathname.startsWith('/oauth/callback/');
}

export function getPageContext({ origin, pathname, referrer }) {
  const cleanPathname = pathname.split(/[?#]/, 1)[0];
  let pageReferrer = '';
  if (referrer) {
    try {
      const parsedReferrer = new URL(referrer);
      pageReferrer = parsedReferrer.origin === origin
        ? `${parsedReferrer.origin}${parsedReferrer.pathname}`
        : parsedReferrer.origin;
    } catch {
      pageReferrer = '';
    }
  }
  return { page_location: `${origin}${cleanPathname}`, page_referrer: pageReferrer };
}

export function createGoogleAnalyticsTracker(measurementId, send) {
  let initialized = false;
  let lastPathname = null;

  return ({ pathname, pageContext }) => {
    const cleanPathname = pathname.split(/[?#]/, 1)[0];
    if (!initialized && isOAuthCallback(cleanPathname)) return false;
    if (cleanPathname === lastPathname) return false;
    lastPathname = cleanPathname;

    send('set', pageContext);
    if (!initialized) {
      send('js', new Date());
      send('config', measurementId, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
      initialized = true;
    }
    if (!isOAuthCallback(cleanPathname)) {
      send('event', 'page_view', {
        page_location: pageContext.page_location,
        page_referrer: pageContext.page_referrer,
      });
    }
    return true;
  };
}
