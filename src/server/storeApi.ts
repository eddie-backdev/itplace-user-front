import 'server-only';

export type StoreSeoDetail = {
  store: {
    storeId: number;
    storeName: string;
    business?: string | null;
    city?: string | null;
    town?: string | null;
    legalDong?: string | null;
    address?: string | null;
    roadName?: string | null;
    roadAddress?: string | null;
    postCode?: string | null;
    latitude: number;
    longitude: number;
  };
  partner: {
    partnerId: number;
    partnerName: string;
    category?: string | null;
    image?: string | null;
  };
};

export type StorePreviewBatch = {
  stores: Array<{
    storeId: number;
    partnerId: number;
    storeName: string;
    latitude: number;
    longitude: number;
    address?: string | null;
    roadAddress?: string | null;
  }>;
  partners: Array<{ partnerId: number; partnerName: string; category?: string | null }>;
  hasMore: boolean;
  nextCursor: number | null;
};

export type StoreFetchResult<T> =
  | { status: 'success'; data: T }
  | { status: 'not-found'; data: null }
  | { status: 'unavailable'; data: null };

const apiBaseUrl =
  process.env.USER_API_BASE_URL?.trim() || process.env.NEXT_PUBLIC_APP_BASE_URL?.trim() || 'http://localhost:8080/';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isStoreSeoDetail = (value: unknown): value is StoreSeoDetail => {
  if (!isRecord(value) || !isRecord(value.store) || !isRecord(value.partner)) return false;
  return Number.isSafeInteger(value.store.storeId) && typeof value.store.storeName === 'string'
    && isFiniteNumber(value.store.latitude) && isFiniteNumber(value.store.longitude)
    && Number.isSafeInteger(value.partner.partnerId) && typeof value.partner.partnerName === 'string';
};

const isStorePreviewBatch = (value: unknown): value is StorePreviewBatch => {
  if (!isRecord(value) || !Array.isArray(value.stores) || !Array.isArray(value.partners)
      || typeof value.hasMore !== 'boolean'
      || (value.nextCursor !== null && !isFiniteNumber(value.nextCursor))) return false;
  return value.stores.every((store) => isRecord(store)
    && Number.isSafeInteger(store.storeId) && Number.isSafeInteger(store.partnerId)
    && typeof store.storeName === 'string' && isFiniteNumber(store.latitude) && isFiniteNumber(store.longitude))
    && value.partners.every((partner) => isRecord(partner)
      && Number.isSafeInteger(partner.partnerId) && typeof partner.partnerName === 'string');
};

const getPublicData = async <T>(path: string, isData: (value: unknown) => value is T): Promise<StoreFetchResult<T>> => {
  try {
    const response = await fetch(new URL(path, apiBaseUrl), {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 404) return { status: 'not-found', data: null };
    if (!response.ok) return { status: 'unavailable', data: null };
    const body = (await response.json()) as { data?: unknown };
    if (!isData(body.data)) return { status: 'unavailable', data: null };
    return { status: 'success', data: body.data };
  } catch {
    return { status: 'unavailable', data: null };
  }
};

export const getStoreSeoDetail = (storeId: number) => {
  if (!Number.isSafeInteger(storeId) || storeId <= 0) {
    return Promise.resolve({ status: 'not-found', data: null } as const);
  }
  return getPublicData<StoreSeoDetail>(`/api/v1/maps/stores/${storeId}`, isStoreSeoDetail);
};

export const getNearbyStorePreviewBatch = (lat: number, lng: number, radiusMeters = 2500) => {
  const params = new URLSearchParams({
    lat: String(lat), lng: String(lng), radiusMeters: String(radiusMeters),
    userLat: String(lat), userLng: String(lng),
    pageSize: '20', afterStoreId: '0',
  });
  return getPublicData<StorePreviewBatch>(`/api/v1/maps/nearby/previews/compact/page?${params}`, isStorePreviewBatch).then(
    (result): StoreFetchResult<StorePreviewBatch> =>
      result.status === 'not-found' ? { status: 'unavailable', data: null } : result
  );
};
