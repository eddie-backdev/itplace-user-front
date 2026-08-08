import React from 'react';
import { TbDeviceComputerCamera } from 'react-icons/tb';

interface RoadviewButtonProps {
  isRoadviewMode: boolean;
  onToggle: () => void;
}

const RoadviewButton: React.FC<RoadviewButtonProps> = ({ isRoadviewMode, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`
        flex h-12 w-12 items-center justify-center rounded-xl shadow-[0_5px_16px_rgba(36,35,33,0.10)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand max-md:h-10 max-md:w-10
        ${
          isRoadviewMode
            ? 'border border-brand bg-brand text-white hover:bg-brandStrong'
            : 'border border-warmBorder bg-warmSurface text-grey05 hover:border-brand/30 hover:bg-brandSoft hover:text-brandStrong'
        }
      `}
      aria-label={isRoadviewMode ? '로드뷰 끄기' : '로드뷰 켜기'}
    >
      <TbDeviceComputerCamera size={24} className="max-md:w-5 max-md:h-5" />
    </button>
  );
};

export default RoadviewButton;
