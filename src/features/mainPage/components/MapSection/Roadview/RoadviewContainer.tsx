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
          const accentColor = isSelected ? '#7132F5' : '#D8CBFE';
          const markerName = markerElement.getAttribute('title') || '가맹점';

          overlay.setZIndex(isSelected ? 1000 : 1);
          markerElement.style.zIndex = isSelected ? '1000' : '1';
          markerElement.style.filter = isSelected
            ? 'drop-shadow(0 4px 8px rgba(113, 50, 245, 0.38))'
            : 'drop-shadow(1px 3px 5px rgba(16, 17, 20, 0.22))';
          markerElement.style.transform = isSelected ? 'scale(1.08)' : 'none';
          markerElement.setAttribute(
            'aria-label',
            `${markerName} 혜택 위치${isSelected ? ', 선택됨' : ''}`
          );
          markerElement
            .querySelectorAll<SVGElement>('[data-marker-outline="true"]')
            .forEach((outline) => {
              outline.setAttribute('stroke', accentColor);
              outline.setAttribute('stroke-width', isSelected ? '2' : '1.25');
            });
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

      const response = await getStoreList({
        lat,
        lng,
        radiusMeters: 50,
        userLat,
        userLng,
      });

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
              storeId: storeInfo.storeId,
              partnerId: partnerInfo.partnerId,
              name: storeInfo.storeName,
              latitude: storeInfo.latitude,
              longitude: storeInfo.longitude,
              imageUrl: partnerInfo.image,
              business: storeInfo.business,
              city: storeInfo.city,
              town: storeInfo.town,
              address: storeInfo.address,
              roadAddress: storeInfo.roadAddress,
            } as Platform;

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
    if (!clickedLatLng || !roadviewRef.current) return;

    const { lat, lng } = clickedLatLng;
    const roadviewClient = new window.kakao.maps.RoadviewClient();
    const roadview = new window.kakao.maps.Roadview(roadviewRef.current);

    roadviewObjRef.current = roadview;

    // 클릭한 위치 근처의 로드뷰 파노라마 ID 검색
    const latLng = new window.kakao.maps.LatLng(lat, lng);
    roadviewClient.getNearestPanoId(latLng, 50, (panoId: string | null) => {
      if (panoId) {
        roadview.setPanoId(panoId, latLng);

        // 로드뷰 로드 후 초기 오버레이 업데이트
        setTimeout(() => {
          updateRoadviewOverlaysRef.current?.(lat, lng, roadview);
        }, 500);
      } else {
        showToast('해당 위치에 로드뷰가 없습니다.', 'info');
        onCloseRef.current();
      }
    });

    // 로드뷰 위치 변경 시마다 오버레이 갱신
    window.kakao.maps.event.addListener(roadview, 'position_changed', () => {
      const pos = roadview.getPosition();
      updateRoadviewOverlaysRef.current?.(pos.getLat(), pos.getLng(), roadview);
    });

    return () => {
      // 오버레이 정리
      currentOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
      currentOverlaysRef.current = [];
      roadviewObjRef.current = null;
    };
  }, [clickedLatLng]);

  return (
    <div className="absolute inset-0 z-[20]">
      {/* 키프레임 애니메이션 정의 */}
      <style>
        {`
          @keyframes bounceScale {
            0%, 100% { transform: scale(1.2) translateY(0px); }
            50% { transform: scale(1.2) translateY(-8px); }
          }
          
          /* 모바일에서 카카오 로드뷰 기본 컨트롤 숨기기 */
          @media (max-width: 768px) {
            button[id*="_zoomout_button_"],
            button[id*="_zoomin_button_"],
            button[id*="_compass_button_"],
            div[id*="bundlewrap"],
            div[id*="_box_util_903"],
            .bundlewrap,
            [class*="bundlewrap_904"] {
              display: none !important;
            }
          }
        `}
      </style>

      {/* 로드뷰 */}
      <div ref={roadviewRef} className="w-full h-full rounded-[18px]" />

      {/* 로드뷰 닫기 버튼 */}
      <button
        onClick={() => onCloseRef.current()}
        className="absolute top-4 right-4 max-md:top-[60px] max-md:px-3 max-md:py-1.5 max-md:text-xs z-[1001] bg-black/70 text-white px-4 py-2 rounded-lg hover:bg-black/80 transition-colors"
      >
        돌아가기
      </button>
    </div>
  );
};

export default RoadviewContainer;
