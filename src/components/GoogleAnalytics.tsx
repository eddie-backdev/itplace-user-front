'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  canLoadGoogleAnalytics,
  createGoogleAnalyticsTracker,
  getPageContext,
  isOAuthCallback,
} from './googleAnalytics.mjs';

declare global {
  interface Window {
    dataLayer?: IArguments[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
export default function GoogleAnalytics() {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const tracker = useRef<ReturnType<typeof createGoogleAnalyticsTracker> | null>(null);
  const previousLocation = useRef<string | null>(null);

  useEffect(() => {
    setAllowed(canLoadGoogleAnalytics({
      environment: process.env.NODE_ENV,
      hostname: window.location.hostname,
      measurementId,
    }));
  }, []);

  useLayoutEffect(() => {
    if (!allowed || !pathname || (isOAuthCallback(pathname) && !tracker.current)) return;
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = window.gtag ?? function gtag() {
      window.dataLayer?.push(arguments); // eslint-disable-line prefer-rest-params -- matches Google's official dataLayer shim
    };
    const currentUrl = new URL(window.location.href);
    const pageLocation = `${currentUrl.origin}${pathname}`;
    const pageReferrer = previousLocation.current ?? document.referrer;
    tracker.current ??= createGoogleAnalyticsTracker(measurementId!, (...args) => {
      window.gtag?.(...args);
    });
    tracker.current({
      pathname,
      pageContext: getPageContext({
        origin: currentUrl.origin,
        pathname,
        referrer: pageReferrer,
      }),
    });
    previousLocation.current = pageLocation;
    setScriptReady(true);
  }, [allowed, pathname]);

  if (!scriptReady) return null;

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      strategy="afterInteractive"
    />
  );
}
