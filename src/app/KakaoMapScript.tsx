'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  KAKAO_MAP_ERROR_EVENT,
  KAKAO_MAP_LOAD_TIMEOUT_MS,
  KAKAO_MAP_READY_EVENT,
  setKakaoMapSdkStatus,
} from '@/constants/kakaoMapSdk';

const SCRIPT_ID = 'itplace-kakao-map-sdk';

interface KakaoMapScriptProps {
  enabled?: boolean;
}

export default function KakaoMapScript({ enabled = false }: KakaoMapScriptProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled && pathname !== '/map') return;

    const key = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim();
    const loadTimeoutRef: { current?: number } = {};
    let isActive = true;

    const clearLoadTimeout = () => {
      if (loadTimeoutRef.current !== undefined) {
        window.clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = undefined;
      }
    };

    const notifyError = () => {
      if (!isActive) return;
      clearLoadTimeout();
      setKakaoMapSdkStatus('error');
      window.dispatchEvent(new Event(KAKAO_MAP_ERROR_EVENT));
    };
    const notifyReady = () => {
      if (!isActive) return;
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

    const handleScriptError = (script: HTMLScriptElement) => {
      notifyError();
      script.remove();
    };
    const ensureFailedScriptCleanup = (script: HTMLScriptElement) => {
      if (script.dataset.retryCleanup) return;
      script.dataset.retryCleanup = 'true';
      script.addEventListener('error', () => script.remove(), { once: true });
    };
    setKakaoMapSdkStatus('loading');
    loadTimeoutRef.current = window.setTimeout(notifyError, KAKAO_MAP_LOAD_TIMEOUT_MS);

    if (window.kakao?.maps) {
      initialize();
      return () => {
        isActive = false;
        clearLoadTimeout();
      };
    }

    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      ensureFailedScriptCleanup(existingScript);
      existingScript.addEventListener('load', initialize, { once: true });
      const onError = () => handleScriptError(existingScript);
      existingScript.addEventListener('error', onError, { once: true });
      return () => {
        isActive = false;
        clearLoadTimeout();
        existingScript.removeEventListener('load', initialize);
        existingScript.removeEventListener('error', onError);
      };
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;
    ensureFailedScriptCleanup(script);
    script.addEventListener('load', initialize, { once: true });
    const onError = () => handleScriptError(script);
    script.addEventListener('error', onError, { once: true });
    document.head.appendChild(script);

    return () => {
      isActive = false;
      clearLoadTimeout();
      script.removeEventListener('load', initialize);
      script.removeEventListener('error', onError);
    };
  }, [enabled, pathname]);

  return null;
}
