import React, { useRef, useEffect, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { Platform } from '../../../types';
import { KakaoRoadview, KakaoCustomOverlay } from '../../../types/kakao';
import { getStoreList, getCurrentLocation } from '../../../api/storeApi';
import CustomMarker from '../KakaoMap/CustomMarker';
import { installCustomMarkerImageFallback } from '../KakaoMap/customMarkerFallback';
import { showToast } from '../../../../../utils/toast';

interface RoadviewContainerProps {
  clickedLatLng: { lat: number; lng: number } | null;
  onClose: () => void;
  onPlatformSelect?: (platform: Platform | null) => void;
  selectedPlatform?: Platform | null;
}

const RoadviewContainer: React.FC<RoadviewContainerProps> = ({
  clickedLatLng,
  onClose,
  onPlatformSelect,
  selectedPlatform,
}) => {
  const roadviewRef = useRef<HTMLDivElement>(null);
  const roadviewObjRef = useRef<KakaoRoadview | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(
    selectedPlatform?.storeId || null
  );

  // 오버레이 관리용 ref 추가
  const currentOverlaysRef = useRef<KakaoCustomOverlay[]>([]);
  const overlayRequestVersionRef = useRef(0);

  // selectedPlatform이 변경되면 selectedStoreId 업데이트
  useEffect(() => {
    const newSelectedStoreId = selectedPlatform?.storeId || null;
    if (newSelectedStoreId !== selectedStoreId) {
      setSelectedStoreId(newSelectedStoreId);
      updateMarkerSelection(newSelectedStoreId);
    }
  }, [selectedPlatform, selectedStoreId]);

  // 마커 선택 상태만 업데이트하는 함수
  const updateMarkerSelection = (newSelectedStoreId: number | null) => {
    currentOverlaysRef.current.forEach((overlay) => {
      const overlayElement = overlay.getContent();
      if (overlayElement) {
        const markerElement = overlayElement.querySelector<HTMLElement>('[data-store-id]');
        if (markerElement) {
          const storeId = parseInt(markerElement.getAttribute('data-store-id') || '0');
          const isSelected = newSelectedStoreId === storeId;
          const accentColor = isSelected ? '#0066CC' : '#A3ABB5';
          const markerName = markerElement.getAttribute('title') || '가맹점';

          overlay.setZIndex(isSelected ? 1000 : 1);
          markerElement.style.zIndex = isSelected ? '1000' : '1';
          markerElement.style.filter = isSelected
            ? 'drop-shadow(0 5px 9px rgba(0, 102, 204, 0.20))'
            : 'none';
          markerElement.style.transform = isSelected ? 'scale(1.06)' : 'none';
          markerElement.setAttribute(
            'aria-label',
            `${markerName} 혜택 위치${isSelected ? ', 선택됨' : ''}`
          );
          markerElement
            .querySelectorAll<SVGElement>('[data-marker-outline="true"]')
            .forEach((outline) => {
              outline.setAttribute('stroke', accentColor);
              outline.setAttribute('stroke-width', isSelected ? '2.5' : '1.5');
            });
          markerElement
            .querySelectorAll<SVGElement>('[data-marker-tail="true"]')
            .forEach((tail) => tail.setAttribute('fill', accentColor));
        }
      }
    });
  };

  // onPlatformSelect ref로 관리
  const onPlatformSelectRef = useRef(onPlatformSelect);
  onPlatformSelectRef.current = onPlatformSelect;

  // onClose ref로 관리
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // selectedStoreId ref로 관리
  const selectedStoreIdRef = useRef(selectedStoreId);
  selectedStoreIdRef.current = selectedStoreId;

  // 로드뷰 오버레이 업데이트 함수를 ref로 관리
  const updateRoadviewOverlaysRef = useRef<
    ((lat: number, lng: number, roadview: KakaoRoadview) => Promise<void>) | null
  >(null);

  updateRoadviewOverlaysRef.current = async (lat: number, lng: number, roadview: KakaoRoadview) => {
    const requestVersion = ++overlayRequestVersionRef.current;
    try {
      // 사용자 현재 위치 가져오기
      let userLat: number | undefined;
      let userLng: number | undefined;

      try {
        const userLocation = await getCurrentLocation();
        userLat = userLocation.lat;
        userLng = userLocation.lng;
      } catch {
        // 사용자 위치를 가져올 수 없으면 undefined로 API 호출
      }

      if (
        roadviewObjRef.current !== roadview ||
        overlayRequestVersionRef.current !== requestVersion
      ) {
        return;
      }

      const response = await getStoreList({
        lat,
        lng,
        radiusMeters: 50,
        userLat,
        userLng,
      });

      if (
        roadviewObjRef.current !== roadview ||
        overlayRequestVersionRef.current !== requestVersion
      ) {
        return;
      }

      // 기존 오버레이 제거
      currentOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
      currentOverlaysRef.current = [];

      // 새 오버레이 추가
      response.data.forEach((storeData) => {
        // API 응답 구조에 맞게 데이터 추출 - 실제 필드명 사용
        const storeInfo = storeData.store;
        const partnerInfo = storeData.partner;
        const distance = storeData.distance; // API에서 제공하는 거리 정보 (km)
        const isSelected = selectedStoreIdRef.current === storeInfo.storeId;

        // CustomMarker 컴포넌트를 HTML로 렌더링 - 거리와 선택 상태 적용
        const markerHTML = renderToString(
          <CustomMarker
            imageUrl={partnerInfo.image}
            name={partnerInfo.partnerName}
            isSelected={isSelected}
            distance={distance}
          />
        );

        // 클릭 가능한 오버레이 요소 생성
        const overlayContent = document.createElement('div');
        overlayContent.innerHTML = markerHTML;
        installCustomMarkerImageFallback(overlayContent);

        // data-store-id 속성 추가 (선택 상태 업데이트용)
        const markerElement = overlayContent.querySelector<HTMLElement>(
          '[data-itplace-map-marker="true"]'
        );
        if (markerElement) {
          markerElement.setAttribute('data-store-id', storeInfo.storeId.toString());
        }

        // 클릭 이벤트 추가 - 리렌더링 없이 선택 상태만 변경
        overlayContent.addEventListener('click', () => {
          if (onPlatformSelectRef.current) {
            const newSelectedStoreId = storeInfo.storeId;
            setSelectedStoreId(newSelectedStoreId);
            updateMarkerSelection(newSelectedStoreId); // 즉시 시각적 업데이트

            const platformStore: Platform = {
              id: `${storeInfo.storeId}-${partnerInfo.partnerId}`,
              storeId: storeInfo.storeId,
              partnerId: partnerInfo.partnerId,
              partnerName: partnerInfo.partnerName,
              name: storeInfo.storeName,
              category: partnerInfo.category,
              latitude: storeInfo.latitude,
              longitude: storeInfo.longitude,
              imageUrl: partnerInfo.image,
              business: storeInfo.business,
              city: storeInfo.city,
              town: storeInfo.town,
              legalDong: storeInfo.legalDong,
              address: storeInfo.address,
              roadName: storeInfo.roadName,
              roadAddress: storeInfo.roadAddress,
              postCode: storeInfo.postCode,
              carrier: storeData.carrier,
              benefits: storeData.tierBenefit.map(
                (benefit) => `${benefit.grade}: ${benefit.context}`
              ),
              benefitDetails: storeData.tierBenefit,
              rating: 0,
              distance,
              hasCoupon: storeInfo.hasCoupon,
            };

            onPlatformSelectRef.current?.(platformStore);
          }
        });

        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(storeInfo.latitude, storeInfo.longitude),
          content: overlayContent,
          clickable: true,
          xAnchor: 0.5,
          yAnchor: 1,
          zIndex: isSelected ? 1000 : 1,
        });

        overlay.setMap(roadview);
        currentOverlaysRef.current.push(overlay);
      });
    } catch {
      // API 호출 실패 시 오버레이 표시 안함
    }
  };

  // 로드뷰 초기화
  useEffect(() => {
    const host = roadviewRef.current;
    if (!clickedLatLng || !host) return;

    const { lat, lng } = clickedLatLng;
    let isActive = true;
    let relayoutFrame: number | null = null;
    let relayoutTimer: ReturnType<typeof setTimeout> | null = null;
    let overlayTimer: ReturnType<typeof setTimeout> | null = null;
    const roadviewClient = new window.kakao.maps.RoadviewClient();
    const roadview = new window.kakao.maps.Roadview(host);
    const eventHandlers: Array<{ type: string; handler: (...args: unknown[]) => void }> = [];

    roadviewObjRef.current = roadview;

    const listen = (type: string, handler: (...args: unknown[]) => void) => {
      window.kakao.maps.event.addListener(roadview, type, handler);
      eventHandlers.push({ type, handler });
    };

    const relayout = () => {
      if (!isActive || !roadview.relayout) return;
      const { width, height } = host.getBoundingClientRect();
      if (width > 0 && height > 0) roadview.relayout();
    };

    const scheduleRelayout = () => {
      if (relayoutTimer) clearTimeout(relayoutTimer);
      relayoutTimer = setTimeout(relayout, 150);
    };

    const scheduleResizeRelayout = () => {
      if (relayoutFrame !== null) return;
      relayoutFrame = requestAnimationFrame(() => {
        relayoutFrame = null;
        relayout();
      });
    };

    const resizeObserver = new ResizeObserver(scheduleResizeRelayout);
    resizeObserver.observe(host);
    scheduleRelayout();

    listen('init', relayout);
    listen('position_changed', () => {
      if (!isActive) return;
      const pos = roadview.getPosition();
      updateRoadviewOverlaysRef.current?.(pos.getLat(), pos.getLng(), roadview);
    });

    // 클릭한 위치 근처의 로드뷰 파노라마 ID 검색
    const latLng = new window.kakao.maps.LatLng(lat, lng);
    roadviewClient.getNearestPanoId(latLng, 50, (panoId: string | null) => {
      if (!isActive || roadviewObjRef.current !== roadview) return;

      if (panoId) {
        roadview.setPanoId(panoId, latLng);
        scheduleRelayout();

        // 로드뷰 로드 후 초기 오버레이 업데이트
        overlayTimer = setTimeout(() => {
          if (isActive) updateRoadviewOverlaysRef.current?.(lat, lng, roadview);
        }, 500);
      } else {
        showToast('해당 위치에 로드뷰가 없습니다.', 'info');
        onCloseRef.current();
      }
    });

    return () => {
      isActive = false;
      overlayRequestVersionRef.current += 1;
      resizeObserver.disconnect();
      if (relayoutFrame !== null) cancelAnimationFrame(relayoutFrame);
      if (relayoutTimer) clearTimeout(relayoutTimer);
      if (overlayTimer) clearTimeout(overlayTimer);
      eventHandlers.forEach(({ type, handler }) => {
        window.kakao.maps.event.removeListener?.(roadview, type, handler);
      });
      // 오버레이 정리
      currentOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
      currentOverlaysRef.current = [];
      if (roadviewObjRef.current === roadview) roadviewObjRef.current = null;
      host.replaceChildren();
    };
  }, [clickedLatLng]);

  return (
    <div className="absolute inset-x-0 top-0 bottom-0 z-[20] max-md:bottom-[var(--itplace-mobile-tab-bar-offset,64px)]">
      {/* 로드뷰 */}
      <div ref={roadviewRef} className="h-full w-full" />

      {/* 로드뷰 닫기 버튼 */}
      <div className="absolute left-4 right-4 top-4 z-[1001] flex items-center justify-between gap-3 max-md:left-3 max-md:right-3 max-md:top-[calc(env(safe-area-inset-top)+12px)]">
        <h2 className="rounded-xl border border-[#e6e6e3] bg-white px-3 py-2 text-sm font-semibold text-[#202120] shadow-[var(--itplace-shadow-card)]">
          로드뷰
        </h2>
        <button
          onClick={() => onCloseRef.current()}
          type="button"
          aria-label="로드뷰 닫고 지도로 돌아가기"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e6e6e3] bg-white px-4 text-sm font-semibold text-[#202120] shadow-[var(--itplace-shadow-card)] transition-colors hover:bg-[#f1f1ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
        >
          지도 화면으로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default RoadviewContainer;
