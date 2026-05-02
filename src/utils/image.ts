export const getImageFallbackText = (label?: string | null) => {
  const normalized = label?.trim();
  return normalized ? normalized.charAt(0).toUpperCase() : '?';
};

export const normalizeImageSrc = (src?: string | null) => {
  const trimmed = src?.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (/^(https?:|data:image\/|blob:|\/)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('images/')) return `/${trimmed}`;

  return trimmed;
};
