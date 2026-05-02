import { ImgHTMLAttributes, useMemo, useState } from 'react';
import { getImageFallbackText, normalizeImageSrc } from '../utils/image';

type SafeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'onError'> & {
  src?: string | null;
  alt: string;
  fallbackLabel?: string | null;
  fallbackClassName?: string;
};

export default function SafeImage({
  src,
  alt,
  fallbackLabel,
  fallbackClassName = '',
  className = '',
  ...props
}: SafeImageProps) {
  const normalizedSrc = useMemo(() => normalizeImageSrc(src), [src]);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const shouldRenderImage = normalizedSrc && failedSrc !== normalizedSrc;

  if (shouldRenderImage) {
    return (
      <img
        {...props}
        src={normalizedSrc}
        alt={alt}
        className={className}
        onError={() => setFailedSrc(normalizedSrc)}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={alt}
      className={`inline-flex items-center justify-center rounded bg-grey01 text-purple04 font-bold ${className} ${fallbackClassName}`}
    >
      {getImageFallbackText(fallbackLabel ?? alt)}
    </span>
  );
}
