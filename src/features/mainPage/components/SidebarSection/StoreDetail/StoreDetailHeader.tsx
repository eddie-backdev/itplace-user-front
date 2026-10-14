import React from 'react';
import { TbArrowLeft } from 'react-icons/tb';
import { Platform } from '../../../types';
import SafeImage from '../../../../../components/SafeImage';

interface StoreDetailHeaderProps {
  platform: Platform;
  imageUrl?: string | null;
  onClose: () => void;
}

const StoreDetailHeader: React.FC<StoreDetailHeaderProps> = ({ platform, imageUrl, onClose }) => {
  const displayImageUrl = imageUrl?.trim() || platform.imageUrl;
  return (
    <>
      <div className="mb-3 flex justify-start max-md:mb-2">
        <button
          type="button"
          onClick={onClose}
          aria-label="매장 목록으로 돌아가기"
          className="relative z-10 -ml-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-[#69717e] transition-colors hover:bg-[#f1f1ee] hover:text-[#202120] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
        >
          <TbArrowLeft size={20} aria-hidden="true" />
          목록으로
        </button>
      </div>

      <div className="mb-3 flex min-w-0 items-center gap-3 py-1 max-md:mb-2">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden">
          <SafeImage
            src={displayImageUrl}
            alt={`${platform.name} 로고`}
            fallbackLabel={platform.name}
            className="h-full w-full object-contain"
            fallbackClassName="text-title-5 max-md:text-title-6"
          />
        </div>
        <h2 className="min-w-0 break-words text-base font-semibold leading-6 text-[#202120]">
          {platform.name}
        </h2>
      </div>
    </>
  );
};

export default StoreDetailHeader;
