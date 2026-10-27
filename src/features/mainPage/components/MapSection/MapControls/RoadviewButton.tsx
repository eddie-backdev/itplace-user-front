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
        flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--itplace-color-accent)] max-md:h-11 max-md:w-11
        ${
          isRoadviewMode
            ? 'border border-[var(--itplace-color-accent)] bg-[var(--itplace-color-brand)] text-[var(--itplace-color-on-brand)] hover:bg-[var(--itplace-color-brand-hover)]'
            : 'border border-[var(--itplace-color-border)] bg-warmSurface text-[var(--itplace-color-text-secondary)] shadow-[0_2px_8px_rgba(31,38,52,0.08)] hover:bg-[var(--itplace-color-canvas)] hover:text-[var(--itplace-color-text)]'
        }
      `}
      aria-label={isRoadviewMode ? '로드뷰 끄기' : '로드뷰 켜기'}
    >
      <TbDeviceComputerCamera size={20} />
    </button>
  );
};

export default RoadviewButton;
