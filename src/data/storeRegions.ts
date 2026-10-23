export const storeRegions = [
  { slug: 'gangnam-station', name: '강남역', latitude: 37.4979, longitude: 127.0276, radiusMeters: 1800 },
  { slug: 'hongik-university-station', name: '홍대입구역', latitude: 37.5572, longitude: 126.9254, radiusMeters: 1800 },
] as const;

export const getStoreRegion = (slug: string) => storeRegions.find((region) => region.slug === slug);
