'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TbCurrentLocation, TbExternalLink, TbSearch, TbX } from 'react-icons/tb';
import SafeImage from '@/components/SafeImage';
import KakaoMapScript from '@/app/KakaoMapScript';
import KakaoMap from '@/features/mainPage/components/MapSection/KakaoMap';
import { searchStorePreviews } from '@/features/mainPage/api/storeApi';
import type { MapLocation, Platform } from '@/features/mainPage/types';
import type { MapStorePreviewData } from '@/features/mainPage/types/api';
import { transformMapStorePreviewsToPlatforms } from '@/features/mainPage/utils/dataTransform';
import { disableScroll, enableScroll } from '@/utils/scrollLock';
import {
  getKakaoMapSdkStatus,
  KAKAO_MAP_ERROR_EVENT,
  KAKAO_MAP_READY_EVENT,
} from '@/constants/kakaoMapSdk';
import styles from './NearbyStoresDialog.module.css';

interface NearbyStoresDialogProps {
  partner: { partnerId: number; partnerName: string; image?: string | null };
  onClose: () => void;
}

const SEOUL_CITY_HALL: MapLocation = { latitude: 37.5665, longitude: 126.978 };

const isValidCoordinate = (latitude: number, longitude: number) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;

const formatDistance = (distance: number) => {
  if (!Number.isFinite(distance) || distance < 0) return null;
  return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
};

export default function NearbyStoresDialog({ partner, onClose }: NearbyStoresDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [searchStatus, setSearchStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>(
    'loading'
  );
  const [centerLocation, setCenterLocation] = useState<MapLocation>(SEOUL_CITY_HALL);
  const [locationLabel, setLocationLabel] = useState('서울시청 기준');
  const [locationMessage, setLocationMessage] = useState('');
  const [mapMoved, setMapMoved] = useState(false);
  const [sdkStatus, setSdkStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [sdkRetryVersion, setSdkRetryVersion] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const pointerDownOnBackdropRef = useRef(false);
  const mountedRef = useRef(false);
  const searchCenterRef = useRef<MapLocation>(SEOUL_CITY_HALL);
  const queriedCenterRef = useRef<MapLocation>(SEOUL_CITY_HALL);
  const activeSearchRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const geolocationRequestRef = useRef(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!mounted || !dialog) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    mountedRef.current = true;
    disableScroll();
    closeButtonRef.current?.focus();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      activeSearchRef.current?.abort();
      activeSearchRef.current = null;
      if (dialog.open) dialog.close();
      enableScroll();
      previousFocusRef.current?.focus();
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const syncStatus = () => {
      const status = getKakaoMapSdkStatus();
      setSdkStatus(status === 'idle' ? 'loading' : status);
    };
    window.addEventListener(KAKAO_MAP_READY_EVENT, syncStatus);
    window.addEventListener(KAKAO_MAP_ERROR_EVENT, syncStatus);
    syncStatus();
    return () => {
      window.removeEventListener(KAKAO_MAP_READY_EVENT, syncStatus);
      window.removeEventListener(KAKAO_MAP_ERROR_EVENT, syncStatus);
    };
  }, [mounted, sdkRetryVersion]);

  const loadStores = useCallback(
    async (center: MapLocation) => {
      activeSearchRef.current?.abort();
      const controller = new AbortController();
      activeSearchRef.current = controller;
      const requestId = ++requestIdRef.current;
      searchCenterRef.current = center;
      queriedCenterRef.current = center;
      setSearchStatus('loading');
      setPlatforms([]);
      setSelectedPlatform(null);

      try {
        const response = await searchStorePreviews(
          {
            keyword: partner.partnerName,
            lat: center.latitude,
            lng: center.longitude,
            userLat: center.latitude,
            userLng: center.longitude,
          },
          controller.signal
        );
        if (!mountedRef.current || controller.signal.aborted || requestId !== requestIdRef.current)
          return;

        const matchingStores = response.data.filter(
          (store: MapStorePreviewData) =>
            store.partnerId === partner.partnerId &&
            isValidCoordinate(store.latitude, store.longitude)
        );
        const nextPlatforms = transformMapStorePreviewsToPlatforms(matchingStores);
        setPlatforms(nextPlatforms);
        setSearchStatus(nextPlatforms.length > 0 ? 'ready' : 'empty');
      } catch {
        if (!mountedRef.current || controller.signal.aborted || requestId !== requestIdRef.current)
          return;
        setSearchStatus('error');
      }
    },
    [partner.partnerId, partner.partnerName]
  );

  useEffect(() => {
    if (!mounted) return;
    void loadStores(SEOUL_CITY_HALL);
  }, [loadStores, mounted]);

  const requestCurrentLocation = useCallback(() => {
    const requestId = ++geolocationRequestRef.current;
    if (!navigator.geolocation) {
      setLocationMessage(
        '이 기기에서는 위치 정보를 사용할 수 없습니다. 현재 검색 위치를 유지합니다.'
      );
      return;
    }

    setLocationMessage('현재 위치를 확인하고 있습니다.');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (
          !mountedRef.current ||
          requestId !== geolocationRequestRef.current ||
          !isValidCoordinate(coords.latitude, coords.longitude)
        )
          return;
        const location = { latitude: coords.latitude, longitude: coords.longitude };
        searchCenterRef.current = location;
        setCenterLocation(location);
        setLocationLabel('현재 위치 기준');
        setLocationMessage('');
        setMapMoved(false);
        void loadStores(location);
      },
      () => {
        if (!mountedRef.current || requestId !== geolocationRequestRef.current) return;
        setLocationMessage('위치를 확인할 수 없어 현재 검색 위치를 유지합니다.');
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 }
    );
  }, [loadStores]);

  useEffect(() => {
    if (!mounted) return;
    requestCurrentLocation();
  }, [mounted, requestCurrentLocation]);

  const handleMapCenterChange = useCallback((location: MapLocation) => {
    if (!isValidCoordinate(location.latitude, location.longitude)) return;
    geolocationRequestRef.current += 1;
    searchCenterRef.current = location;
    setMapMoved(true);
  }, []);

  const searchThisArea = () => {
    geolocationRequestRef.current += 1;
    const center = searchCenterRef.current;
    setCenterLocation(center);
    setLocationLabel('선택한 지도 위치 기준');
    setLocationMessage('');
    setMapMoved(false);
    void loadStores(center);
  };

  const selectPlatform = (platform: Platform | null) => {
    setSelectedPlatform(platform);
    if (!platform) return;
    const location = { latitude: platform.latitude, longitude: platform.longitude };
    searchCenterRef.current = location;
    setCenterLocation(location);
  };

  const retrySearch = () => {
    void loadStores(queriedCenterRef.current);
  };

  const retryMap = () => {
    setSdkStatus('loading');
    setSdkRetryVersion((version) => version + 1);
  };

  if (!mounted) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="nearby-stores-title"
      data-itplace-transient-layer="open"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onPointerDown={(event) => {
        const dialog = dialogRef.current;
        if (!dialog || event.target !== dialog) {
          pointerDownOnBackdropRef.current = false;
          return;
        }
        const rect = dialog.getBoundingClientRect();
        pointerDownOnBackdropRef.current =
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom;
      }}
      onClick={(event) => {
        if (pointerDownOnBackdropRef.current && event.target === dialogRef.current) onClose();
        pointerDownOnBackdropRef.current = false;
      }}
    >
      <KakaoMapScript key={sdkRetryVersion} enabled />
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.partner}>
            {partner.image && (
              <SafeImage
                src={partner.image}
                alt={`${partner.partnerName} 로고`}
                className={styles.logo}
                fallbackLabel={partner.partnerName}
                fallbackClassName={styles.logoFallback}
              />
            )}
            <h2 id="nearby-stores-title">{partner.partnerName} 주변 매장</h2>
          </div>
          <button
            ref={closeButtonRef}
            className={styles.closeButton}
            type="button"
            aria-label="닫기"
            onClick={onClose}
          >
            <TbX aria-hidden="true" size={22} />
          </button>
        </header>

        <div className={styles.content}>
          <section className={styles.mapPane} aria-label="매장 위치 지도">
            {sdkStatus === 'error' ? (
              <div className={styles.mapError} role="status">
                <p>지도를 불러오지 못했어요.</p>
                <button type="button" onClick={retryMap}>
                  지도 다시 불러오기
                </button>
              </div>
            ) : (
              <KakaoMap
                key={sdkRetryVersion}
                platforms={platforms}
                selectedPlatform={selectedPlatform}
                onPlatformSelect={selectPlatform}
                initialCenterLocation={SEOUL_CITY_HALL}
                centerLocation={centerLocation}
                initialMapLevel={5}
                autoLocate={false}
                onMapCenterChange={handleMapCenterChange}
              />
            )}
            <div className={styles.mapActions}>
              <button type="button" onClick={requestCurrentLocation}>
                <TbCurrentLocation aria-hidden="true" size={18} /> 내 위치
              </button>
              <button type="button" onClick={searchThisArea} disabled={!mapMoved}>
                <TbSearch aria-hidden="true" size={18} /> 이 지역 다시 검색
              </button>
            </div>
          </section>

          <aside className={styles.listPane} aria-label="주변 매장 목록">
            <div className={styles.listHeading}>
              <h3>주변 매장</h3>
              <span>{locationLabel}</span>
            </div>
            {locationMessage && <p className={styles.locationMessage}>{locationMessage}</p>}
            <div
              className={styles.storeList}
              aria-live="polite"
              aria-busy={searchStatus === 'loading'}
            >
              {searchStatus === 'loading' && (
                <p className={styles.statusMessage}>주변 매장을 찾고 있습니다.</p>
              )}
              {searchStatus === 'empty' && (
                <p className={styles.statusMessage}>이 지역에는 표시할 매장이 없습니다.</p>
              )}
              {searchStatus === 'error' && (
                <div className={styles.statusMessage}>
                  <p>매장 목록을 불러오지 못했습니다.</p>
                  <button className={styles.retryButton} type="button" onClick={retrySearch}>
                    다시 시도
                  </button>
                </div>
              )}
              {platforms.map((platform) => {
                const selected = selectedPlatform?.id === platform.id;
                const distance = formatDistance(platform.distance);
                return (
                  <div
                    key={`${platform.id}:${platform.partnerId}`}
                    className={`${styles.storeItem} ${selected ? styles.storeItemSelected : ''}`}
                  >
                    <button
                      className={styles.storeSelect}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectPlatform(platform)}
                    >
                      <span className={styles.storeName}>{platform.name}</span>
                      <span className={styles.storeAddress}>
                        {platform.roadAddress || platform.address || '주소 정보 없음'}
                      </span>
                      {distance && (
                        <span className={styles.storeDistance}>검색 위치에서 {distance}</span>
                      )}
                    </button>
                    {selected && (
                      <a
                        className={styles.directionsLink}
                        href={`https://map.kakao.com/link/to/${encodeURIComponent(platform.name)},${platform.latitude},${platform.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${platform.name} 길찾기 새 창에서 열기`}
                      >
                        카카오맵 길찾기 <TbExternalLink aria-hidden="true" size={15} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
            <p className={styles.note}>매장별 이용 조건은 혜택 상세에서 확인해주세요.</p>
          </aside>
        </div>
      </div>
    </dialog>,
    document.body
  );
}
