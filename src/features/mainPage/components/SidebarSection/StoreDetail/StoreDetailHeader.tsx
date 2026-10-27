import React from 'react';
import { TbArrowLeft, TbX } from 'react-icons/tb';
import { Platform } from '../../../types';
import SafeImage from '../../../../../components/SafeImage';

interface StoreDetailHeaderProps {
  platform: Platform;
  imageUrl?: string | null;
  onClose: () => void;
  closeMode?: 'back' | 'dismiss';
}

const StoreDetailHeader: React.FC<StoreDetailHeaderProps> = ({
  platform,
  imageUrl,
  onClose,
  closeMode = 'back',
}) => {
  const displayImageUrl = imageUrl?.trim() || platform.imageUrl;
  const title = (
    <>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden max-md:h-10 max-md:w-10">
        <SafeImage
          src={displayImageUrl}
          alt={`${platform.name} 로고`}
          fallbackLabel={platform.name}
          className="h-full w-full object-contain"
          fallbackClassName="text-title-6"
        />
      </div>
      <h2 className="min-w-0 flex-1 break-words text-[18px] font-semibold leading-6 text-[var(--itplace-color-text)] max-md:line-clamp-2">
        {platform.name}
      </h2>
    </>
  );

  if (closeMode === 'dismiss') {
    return (
      <header className="flex shrink-0 items-center gap-3 border-b border-[var(--itplace-color-border)] bg-warmSurface px-4 py-3">
        {title}
        <button
          type="button"
          onClick={onClose}
          aria-label="혜택 상세 닫기"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--itplace-color-text-secondary)] transition-colors hover:bg-[var(--itplace-color-canvas)] hover:text-[var(--itplace-color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--itplace-color-accent)]"
        >
          <TbX size={22} aria-hidden="true" />
        </button>
      </header>
    );
  }

  return (
    <header className="mb-5 max-md:mb-4">
      <div className="mb-3 hidden justify-start md:flex">
        <button
          type="button"
          onClick={onClose}
          aria-label="매장 목록으로 돌아가기"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium text-[var(--itplace-color-text-secondary)] transition-colors hover:bg-[var(--itplace-color-canvas)] hover:text-[var(--itplace-color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--itplace-color-accent)]"
        >
          <TbArrowLeft size={20} aria-hidden="true" />
          목록으로
        </button>
      </div>
      <div className="flex min-h-11 min-w-0 items-center gap-2 md:hidden">
        <button
          type="button"
          onClick={onClose}
          aria-label="매장 목록으로 돌아가기"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--itplace-color-text-secondary)] transition-colors hover:bg-[var(--itplace-color-canvas)] hover:text-[var(--itplace-color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--itplace-color-accent)]"
        >
          <TbArrowLeft size={20} aria-hidden="true" />
        </button>
        {title}
      </div>
      <div className="hidden min-w-0 items-center gap-3 md:flex">{title}</div>
    </header>
  );
};

export default StoreDetailHeader;
