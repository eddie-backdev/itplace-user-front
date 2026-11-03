import React, { useState } from 'react';
import { TbCurrentLocation } from 'react-icons/tb';
import { showToast } from '../../../../../utils/toast';
import { getCurrentLocation } from '../../../api/storeApi';

interface CurrentLocationButtonProps {
  onLocationMove: (latitude: number, longitude: number) => void;
  onMapCenterMove?: (latitude: number, longitude: number) => void;
}

const CurrentLocationButton: React.FC<CurrentLocationButtonProps> = ({
  onLocationMove,
  onMapCenterMove,
}) => {
  const [isLocating, setIsLocating] = useState(false);

  const handleClick = async () => {
    if (isLocating) return;
    setIsLocating(true);

    try {
      const coords = await getCurrentLocation({ maximumAge: 0 });
      onLocationMove(coords.lat, coords.lng);
      onMapCenterMove?.(coords.lat, coords.lng);
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error ? Number(error.code) : 0;
      const message =
        code === 1
          ? '브라우저와 기기 설정에서 위치 권한을 허용한 뒤 다시 시도해 주세요.'
          : code === 2
            ? 'GPS 또는 네트워크 연결을 확인한 뒤 다시 시도해 주세요.'
            : code === 3
              ? '위치 확인에 시간이 오래 걸렸어요. 다시 시도해 주세요.'
              : error instanceof Error && error.message.includes('지원되지 않는')
                ? '브라우저에서 위치 서비스를 지원하지 않습니다.'
                : '현재 위치를 확인하지 못했어요. 브라우저와 기기의 위치 설정을 확인해 주세요.';
      showToast(message, 'info');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label="현재 위치로 이동"
      aria-busy={isLocating}
      disabled={isLocating}
      className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--itplace-color-border)] bg-[var(--itplace-color-surface)] text-[var(--itplace-color-text-secondary)] shadow-[var(--itplace-shadow-card)] transition-colors duration-200 hover:bg-[var(--itplace-color-surface-hover)] hover:text-[var(--itplace-color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--itplace-color-accent)] disabled:cursor-wait disabled:opacity-70 max-md:h-11 max-md:w-11"
    >
      <TbCurrentLocation
        size={20}
        aria-hidden="true"
        className={isLocating ? 'animate-spin motion-reduce:animate-none' : undefined}
      />
    </button>
  );
};

export default CurrentLocationButton;
