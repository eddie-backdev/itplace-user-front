import React from 'react';
import { getImageFallbackText, normalizeImageSrc } from '../../../../../utils/image';
import { CUSTOM_MARKER_METRICS, type CustomMarkerMode } from './markerMetrics';

interface CustomMarkerProps {
  imageUrl?: string;
  name?: string;
  isSelected?: boolean;
  distance?: number; // 거리 추가 (미터 단위)
  mode?: CustomMarkerMode;
  offsetX?: number;
  offsetY?: number;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({
  imageUrl,
  name,
  isSelected = false,
  mode = 'full',
  offsetX = 0,
  offsetY = 0,
}) => {
  const normalizedImageUrl = normalizeImageSrc(imageUrl);
  const displayName = name || '가맹점';
  const fallbackLabel = getImageFallbackText(displayName);
  const isCompact = mode === 'compact';
  const { width, height, imageSize } = CUSTOM_MARKER_METRICS[mode];
  const bubbleSize = width;
  const tailHalfWidth = isCompact ? 5 : 7;
  const tailTipY = height - 1;
  const accentColor = isSelected ? '#7132F5' : '#D8CBFE';

  return (
    <button
      type="button"
      aria-label={`${displayName} 혜택 위치${isSelected ? ', 선택됨' : ''}`}
      title={displayName}
      data-itplace-map-marker="true"
      data-marker-mode={mode}
      className="relative block cursor-pointer border-0 bg-transparent p-0"
      style={{
        width,
        height,
        lineHeight: 0,
        zIndex: isSelected ? 1000 : 1,
        filter: isSelected
          ? 'drop-shadow(0 4px 8px rgba(113, 50, 245, 0.38))'
          : 'drop-shadow(1px 3px 5px rgba(16, 17, 20, 0.22))',
        transform: `translate(${offsetX}px, ${offsetY}px)${isSelected ? ' scale(1.08)' : ''}`,
        transformOrigin: 'center bottom',
        transition: 'filter 0.2s ease, transform 0.2s ease',
      }}
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        <path
          data-marker-outline="true"
          d={`M${width / 2 - tailHalfWidth} ${bubbleSize - 4} L${width / 2} ${
            tailTipY
          } L${width / 2 + tailHalfWidth} ${bubbleSize - 4} Z`}
          fill="white"
          stroke={accentColor}
          strokeWidth={isSelected ? 2 : 1.25}
          strokeLinejoin="round"
        />
        <rect
          data-marker-outline="true"
          x="1"
          y="1"
          width={bubbleSize - 2}
          height={bubbleSize - 2}
          rx={isCompact ? 9 : 11}
          ry={isCompact ? 9 : 11}
          fill="white"
          stroke={accentColor}
          strokeWidth={isSelected ? 2 : 1.25}
        />
      </svg>

      <span
        className="absolute z-10 inline-flex items-center justify-center overflow-hidden rounded-lg bg-grey01"
        style={{
          width: imageSize,
          height: imageSize,
          left: (bubbleSize - imageSize) / 2,
          top: (bubbleSize - imageSize) / 2,
        }}
        data-marker-image-wrap="true"
      >
        <span
          role="img"
          aria-label={`${displayName} 로고`}
          data-marker-fallback="true"
          className={`inline-flex h-full w-full items-center justify-center bg-purple01 font-extrabold text-purple05 ${
            isCompact ? 'text-[10px]' : 'text-xs'
          } ${normalizedImageUrl ? 'hidden' : ''}`}
        >
          {fallbackLabel}
        </span>
        {normalizedImageUrl && (
          <img
            src={normalizedImageUrl}
            alt={`${displayName} 로고`}
            className="h-full w-full object-contain"
            data-marker-image="true"
          />
        )}
      </span>
    </button>
  );
};

export default CustomMarker;
