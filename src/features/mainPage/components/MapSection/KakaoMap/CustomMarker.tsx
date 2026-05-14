import React from 'react';
import { getImageFallbackText, normalizeImageSrc } from '../../../../../utils/image';

interface CustomMarkerProps {
  imageUrl?: string;
  name?: string;
  isSelected?: boolean;
  distance?: number; // 거리 추가 (미터 단위)
}

const CustomMarker: React.FC<CustomMarkerProps> = ({ imageUrl, name, isSelected = false }) => {
  const normalizedImageUrl = normalizeImageSrc(imageUrl);
  const fallbackLabel = getImageFallbackText(name || '가맹점');

  return (
    <div
      data-itplace-map-marker="true"
      className="relative cursor-pointer w-[68px] h-[84px]"
      style={{
        zIndex: isSelected ? 1000 : 1,
        animation: isSelected ? 'bounceScale 2s ease-in-out infinite' : 'none',
        transformOrigin: 'center bottom',
        transition: 'transform 0.3s ease',
      }}
    >
      {/* 인라인 스타일로 키프레임 정의 */}
      {isSelected && (
        <style>
          {`
            @keyframes bounceScale {
              0%, 100% { transform: scale(1.2) translateY(0px); }
              50% { transform: scale(1.2) translateY(-8px); }
            }
          `}
        </style>
      )}

      <div
        className="w-full h-full"
        style={{
          filter: isSelected
            ? 'drop-shadow(0px 0px 12px rgba(255, 160, 35, 0.9))'
            : 'drop-shadow(2px 2px 8px rgba(0, 0, 0, 0.35))',
        }}
      >
        {/* 말풍선 SVG */}
        <svg width="68" height="84" viewBox="0 0 68 84">
          <rect x="0" y="0" width="68" height="68" rx="12" ry="12" fill="white" />
          <polygon points="27,68 34,78 41,68" fill="white" />
        </svg>

        {/* 로고 이미지: renderToString으로 만든 카카오 오버레이는 React onError가 붙지 않으므로 DOM에 별도 fallback listener를 설치한다. */}
        <div
          className="absolute top-0 left-0 w-[68px] h-[68px] flex items-center justify-center z-10"
          data-marker-image-wrap="true"
        >
          <span
            role="img"
            aria-label={`${name || '가맹점'} 로고`}
            data-marker-fallback="true"
            className={`w-[50px] h-[50px] inline-flex items-center justify-center rounded-lg bg-grey02 text-grey04 text-sm font-bold ${normalizedImageUrl ? 'hidden' : ''}`}
          >
            {fallbackLabel}
          </span>
          {normalizedImageUrl && (
            <img
              src={normalizedImageUrl}
              alt={`${name || '가맹점'} 로고`}
              className="w-[50px] h-[50px] object-contain rounded-lg"
              data-marker-image="true"
            />
          )}
        </div>
      </div>

      {/* ✅ 선택된 경우 별 이미지 (filter 적용 안됨) - 고정 크기 */}
      {isSelected && (
        <img
          src="/images/star.png"
          alt="맵 마커"
          className="absolute -left-2 -top-1 -translate-y-1/2 w-14"
        />
      )}
    </div>
  );
};

export default CustomMarker;
