import React from 'react';
import { TbCurrentLocation } from 'react-icons/tb';
import { showToast } from '../../../../../utils/toast';

interface CurrentLocationButtonProps {
  onLocationMove: (latitude: number, longitude: number) => void;
  onMapCenterMove?: (latitude: number, longitude: number) => void;
}

const CurrentLocationButton: React.FC<CurrentLocationButtonProps> = ({
  onLocationMove,
  onMapCenterMove,
}) => {
  const handleClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          onLocationMove(location.latitude, location.longitude);
          onMapCenterMove?.(location.latitude, location.longitude);
        },
        () => {
          showToast('현재 위치를 가져올 수 없습니다.', 'info');
        }
      );
    } else {
      showToast('브라우저에서 위치 서비스를 지원하지 않습니다.', 'info');
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label="현재 위치로 이동"
      className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--itplace-color-border)] bg-[var(--itplace-color-surface)] text-[var(--itplace-color-text-secondary)] shadow-[var(--itplace-shadow-card)] transition-colors duration-200 hover:bg-[var(--itplace-color-surface-hover)] hover:text-[var(--itplace-color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--itplace-color-accent)] max-md:h-11 max-md:w-11"
    >
      <TbCurrentLocation size={20} />
    </button>
  );
};

export default CurrentLocationButton;
