'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { BREAKPOINTS, useResponsive } from '@/hooks/useResponsive';
import {
  KAKAO_MAP_ERROR_EVENT,
  KAKAO_MAP_LOAD_TIMEOUT_MS,
  KAKAO_MAP_READY_EVENT,
  setKakaoMapSdkStatus,
} from '@/constants/kakaoMapSdk';

const SCRIPT_ID = 'itplace-kakao-map-sdk';

export default function KakaoMapScript() {
  const pathname = usePathname();
  const { isMobile } = useResponsive();

  useEffect(() => {
    if (pathname !== '/' && pathname !== '/map') return;
    // Read the actual viewport before hydration finishes restoring media-query state.
    if (pathname === '/' && window.matchMedia(`(max-width: ${BREAKPOINTS.mobileMax}px)`).matches)
      return;

    const key = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim();
    const loadTimeoutRef: { current?: number } = {};

    const clearLoadTimeout = () => {
      if (loadTimeoutRef.current !== undefined) {
        window.clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = undefined;
      }
    };

    const notifyError = () => {
      clearLoadTimeout();
      setKakaoMapSdkStatus('error');
      window.dispatchEvent(new Event(KAKAO_MAP_ERROR_EVENT));
    };
    const notifyReady = () => {
      clearLoadTimeout();
      if (
        typeof window.kakao?.maps?.Map !== 'function' ||
        typeof window.kakao?.maps?.LatLng !== 'function'
      ) {
        notifyError();
        return;
      }
      setKakaoMapSdkStatus('ready');
      window.dispatchEvent(new Event(KAKAO_MAP_READY_EVENT));
    };

    if (!key) {
      notifyError();
      return;
    }

    const initialize = () => {
      if (!window.kakao?.maps) return;
      if (window.kakao.maps.load) window.kakao.maps.load(notifyReady);
      else notifyReady();
    };

    const handleScriptError = () => notifyError();
    setKakaoMapSdkStatus('loading');
    loadTimeoutRef.current = window.setTimeout(notifyError, KAKAO_MAP_LOAD_TIMEOUT_MS);

    if (window.kakao?.maps) {
      initialize();
      return () => {
        clearLoadTimeout();
      };
    }

    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', initialize, { once: true });
      existingScript.addEventListener('error', handleScriptError, { once: true });
      return () => {
        clearLoadTimeout();
        existingScript.removeEventListener('load', initialize);
        existingScript.removeEventListener('error', handleScriptError);
      };
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;
    script.addEventListener('load', initialize, { once: true });
    script.addEventListener('error', handleScriptError, { once: true });
    document.head.appendChild(script);

    return () => {
      clearLoadTimeout();
      script.removeEventListener('load', initialize);
      script.removeEventListener('error', handleScriptError);
    };
  }, [pathname, isMobile]);

  return null;
}
