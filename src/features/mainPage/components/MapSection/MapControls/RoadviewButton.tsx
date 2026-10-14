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
        flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] max-md:h-11 max-md:w-11
        ${
          isRoadviewMode
            ? 'border border-[#0066cc] bg-[#0066cc] text-white hover:bg-[#005bb5]'
            : 'border border-[#e6e6e3] bg-white text-[#596171] shadow-[0_2px_8px_rgba(31,38,52,0.08)] hover:bg-[#f1f1ee] hover:text-[#202120]'
        }
      `}
      aria-label={isRoadviewMode ? '로드뷰 끄기' : '로드뷰 켜기'}
    >
      <TbDeviceComputerCamera size={20} />
    </button>
  );
};

export default RoadviewButton;
