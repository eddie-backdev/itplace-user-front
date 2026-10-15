import React from 'react';
import { TbMapPin, TbWorld } from 'react-icons/tb';

interface StoreDetailInfoProps {
  url?: string;
  roadAddress?: string;
  address?: string;
  postCode?: string;
  distance?: number;
}

const StoreDetailInfo: React.FC<StoreDetailInfoProps> = ({
  url,
  roadAddress,
  address,
  postCode,
  distance,
}) => {
  const distanceLabel =
    typeof distance === 'number' && Number.isFinite(distance)
      ? distance < 1
        ? `${Math.round(distance * 1000)} m`
        : `${distance.toFixed(1)} km`
      : null;

  return (
    <div className="mb-5 flex flex-col gap-2 border-b border-[#E8E9EE] pb-4 text-sm text-[#686B73] max-xl:mb-4">
      {(roadAddress || address) && (
        <div className="flex items-start gap-2">
          <TbMapPin size={17} className="mt-0.5 shrink-0 text-[#686B73]" aria-hidden="true" />
          <div className="min-w-0">
            <span className="mr-2 text-xs font-medium text-[#686B73]">주소</span>
            <span className="break-words text-[13px] leading-[19px] text-[#202124]">
              {roadAddress || address}
            </span>
            {roadAddress && address && roadAddress !== address && (
              <p className="mt-0.5 break-words text-xs leading-4 text-[#686B73]">지번 {address}</p>
            )}
            {postCode && <p className="mt-0.5 text-xs text-[#686B73]">우편번호 {postCode}</p>}
          </div>
        </div>
      )}
      {distanceLabel && (
        <p className="pl-6 text-xs text-[#686B73]">
          직선 거리 <span className="font-medium text-[#202124]">{distanceLabel}</span>
        </p>
      )}
      {url && (
        <div className="flex items-center gap-2 max-md:gap-1.5">
          <TbWorld size={16} className="max-md:w-4 max-md:h-4" />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="매장 웹사이트 (새 창에서 열림)"
            className="min-w-0 truncate text-[#686B73] underline-offset-2 hover:text-[#6154D9] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154D9]"
          >
            {url}
          </a>
        </div>
      )}
    </div>
  );
};

export default StoreDetailInfo;
