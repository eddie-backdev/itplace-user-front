import React from 'react';
import { TbX } from 'react-icons/tb';

interface AddressTooltipProps {
  roadAddress: string;
  lotAddress: string;
  onCopy: (text: string) => void;
  onClose: () => void;
}

const AddressTooltip: React.FC<AddressTooltipProps> = ({
  roadAddress,
  lotAddress,
  onCopy,
  onClose,
}) => {
  return (
    <div
      className="bg-warmSurface border border-grey02 rounded-lg shadow-[0 2px 5px black 0.15] p-3 w-max relative max-md:p-2 max-md:text-sm"
      onClick={(e) => e.stopPropagation()}
    >
      {/* X 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-2 right-2 text-grey04 hover:text-grey05 transition-colors max-md:top-1 max-md:right-1"
      >
        <TbX size={14} className="max-md:w-3 max-md:h-3" />
      </button>

      <div className="space-y-1 pr-4 max-md:pr-3 max-md:space-y-0.5">
        {/* 도로명 주소 */}
        <div className="grid grid-cols-[50px_1fr_30px] gap-3 items-center max-md:grid-cols-[40px_1fr_24px] max-md:gap-2">
          <span className="text-body-5 border border-grey03 px-1 py-[2px] text-grey04 text-center max-md:text-body-6 max-md:px-0.5 max-md:py-[1px]">
            도로명
          </span>
          <span className="text-body-4 text-grey05 truncate max-md:text-body-5">{roadAddress}</span>
          <span
            className="text-body-4 text-accent cursor-pointer hover:text-accentStrong transition-colors self-center max-md:text-body-5"
            onClick={(e) => {
              e.stopPropagation();
              onCopy(roadAddress);
            }}
          >
            복사
          </span>
        </div>

        {/* 지번 주소 */}
        <div className="grid grid-cols-[50px_1fr_30px] gap-3 items-center max-md:grid-cols-[40px_1fr_24px] max-md:gap-2">
          <span className="text-body-5 border border-grey03 px-1 py-[2px] text-grey04 text-center max-md:text-body-6 max-md:px-0.5 max-md:py-[1px]">
            지번
          </span>
          <span className="text-body-4 text-grey05 truncate max-md:text-body-5">{lotAddress}</span>
          <span
            className="text-body-4 text-accent cursor-pointer hover:text-accentStrong transition-colors self-center max-md:text-body-5"
            onClick={(e) => {
              e.stopPropagation();
              onCopy(lotAddress);
            }}
          >
            복사
          </span>
        </div>
      </div>
    </div>
  );
};

export default AddressTooltip;
