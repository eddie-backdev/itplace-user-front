export type CustomMarkerMode = 'full' | 'compact';

export const CUSTOM_MARKER_METRICS: Record<
  CustomMarkerMode,
  { width: number; height: number; imageSize: number }
> = {
  full: { width: 64, height: 78, imageSize: 50 },
  compact: { width: 48, height: 59, imageSize: 36 },
};
