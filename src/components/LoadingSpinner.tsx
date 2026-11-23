import React from 'react';

interface LoadingSpinnerProps {
  /**
   * 스피너에 적용할 Tailwind CSS 클래스입니다.
   * 이 prop을 사용하여 기본 스타일(크기, 색상, 두께 등)을 덮어쓸 수 있습니다.
   */
  className?: string;
}

/**
 * 로딩 상태를 표시하는 재사용 가능한 스피너 컴포넌트입니다.
 *
 * @example
 * // 기본 스타일로 스피너 사용
 * <LoadingSpinner />
 *
 * @example
 * // 크기와 두께 변경 (h-12 w-12 border-8)
 * <LoadingSpinner className="h-12 w-12 border-8 border-orange04 border-t-transparent" />
 *
 * @example
 * // 다른 색상으로 변경 (grey04)
 * <LoadingSpinner className="h-8 w-8 border-4 border-grey04 border-t-transparent" />
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className = 'h-8 w-8 border-4 border-purple04 border-t-transparent',
}) => {
  return (
    <div
      className={`itplace-loading-spinner rounded-full ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">불러오는 중</span>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @media (prefers-reduced-motion: no-preference) {
            .itplace-loading-spinner { animation: spin 1s linear infinite; }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSpinner;
