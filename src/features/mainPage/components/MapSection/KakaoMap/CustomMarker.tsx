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
  const center = width / 2;
  const tipY = height - 1;
  const outerRadius = center - 2;
  const tailShoulderY = bubbleSize - Math.max(9, Math.round(bubbleSize * 0.18));
  const tailHalfWidth = Math.max(5, Math.round(bubbleSize * 0.12));
  const accentColor = isSelected ? '#115C3A' : '#4EA77A';

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
          ? 'drop-shadow(0 5px 9px rgba(17, 92, 58, 0.32))'
          : 'drop-shadow(1px 3px 5px rgba(36, 35, 33, 0.20))',
        transform: `translate(${offsetX}px, ${offsetY}px)${isSelected ? ' scale(1.06)' : ''}`,
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
          data-marker-tail="true"
          d={`M${center - tailHalfWidth} ${tailShoulderY} Q${center - tailHalfWidth * 0.55} ${
            bubbleSize + 3
          } ${center} ${tipY} Q${center + tailHalfWidth * 0.55} ${bubbleSize + 3} ${
            center + tailHalfWidth
          } ${tailShoulderY} Z`}
          fill={accentColor}
        />
        <circle
          data-marker-outline="true"
          cx={center}
          cy={center}
          r={outerRadius}
          fill="white"
          stroke={accentColor}
          strokeWidth={isSelected ? 2.5 : 1.5}
        />
      </svg>

      <span
        className="absolute z-10 inline-flex items-center justify-center overflow-hidden rounded-full bg-grey01"
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
          className={`inline-flex h-full w-full items-center justify-center bg-brandSoft font-extrabold text-brandStrong ${
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
