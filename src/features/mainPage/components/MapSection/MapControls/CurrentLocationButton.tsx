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
      className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#e6e6e3] bg-white text-[#596171] shadow-[0_2px_8px_rgba(31,38,52,0.08)] transition-colors duration-200 hover:bg-[#f1f1ee] hover:text-[#202120] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] max-md:h-11 max-md:w-11"
    >
      <TbCurrentLocation size={20} />
    </button>
  );
};

export default CurrentLocationButton;
