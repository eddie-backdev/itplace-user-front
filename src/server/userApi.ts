import 'server-only';

import { cache } from 'react';
import { getMembershipFilter } from '@/utils/membership';
import type { PartnerBenefitResponse } from '@/features/allBenefitsPage/apis/allBenefitsApi';
import {
  normalizePartnerBenefitDetail,
  type PartnerBenefitDetailResponse,
} from '@/features/allBenefitsPage/apis/partnerBenefitModel';

const configuredUserApiBaseUrl =
  process.env.USER_API_BASE_URL?.trim() || process.env.NEXT_PUBLIC_APP_BASE_URL?.trim();

if (process.env.NODE_ENV === 'production' && !configuredUserApiBaseUrl) {
  throw new Error('USER_API_BASE_URL 또는 NEXT_PUBLIC_APP_BASE_URL 환경 변수가 필요합니다.');
}

const USER_API_BASE_URL = configuredUserApiBaseUrl || 'http://localhost:8080/';

type ApiEnvelope<T> = { data?: T };
type PublicFetchResult<T> =
  | { status: 'success'; data: T }
  | { status: 'not-found'; data: null }
  | { status: 'unavailable'; data: null };

const fetchPublicDataResult = async <T>(url: URL): Promise<PublicFetchResult<T>> => {
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 404) return { status: 'not-found', data: null };
    if (!response.ok) return { status: 'unavailable', data: null };
    const body = (await response.json()) as ApiEnvelope<T>;
    return body.data ? { status: 'success', data: body.data } : { status: 'not-found', data: null };
  } catch {
    return { status: 'unavailable', data: null };
  }
};

const fetchPublicData = async <T>(url: URL): Promise<T | null> => {
  const result = await fetchPublicDataResult<T>(url);
  return result.data;
};

export type PartnerListQuery = {
  keyword?: string;
  carrier?: string;
  page?: number;
  size?: number;
};

const getPublicPartnerBenefitsCached = cache(
  async (keyword = '', carrier = '', page = 0, size = 15) => {
    const url = new URL('/api/v1/benefits/partners', USER_API_BASE_URL);
    url.searchParams.set('mainCategory', 'BASIC_BENEFIT');
    url.searchParams.set('page', String(page));
    url.searchParams.set('size', String(size));
    url.searchParams.set('sort', 'POPULARITY');
    if (keyword) url.searchParams.set('keyword', keyword);
    if (carrier) url.searchParams.set('carriers', carrier);
    return fetchPublicData<PartnerBenefitResponse>(url);
  }
);

export const getPublicPartnerBenefits = ({
  keyword = '',
  carrier = '',
  page = 0,
  size = 15,
}: PartnerListQuery = {}) =>
  getPublicPartnerBenefitsCached(
    keyword.trim().slice(0, 100),
    carrier.trim(),
    Math.max(0, Math.trunc(page)),
    Math.min(200, Math.max(1, Math.trunc(size)))
  );

export const getPublicPartnerBenefitDetailResult = cache(
  async (partnerId: number, carrier?: string, grade?: string) => {
    if (!Number.isInteger(partnerId) || partnerId <= 0) {
      return { status: 'not-found', data: null } as const;
    }
    const url = new URL(`/api/v1/benefits/partners/${partnerId}`, USER_API_BASE_URL);
    const membership = getMembershipFilter(carrier, grade);
    if (membership) {
      url.searchParams.set('carrier', membership.carrier);
      if (membership.grade) url.searchParams.set('grade', membership.grade);
    } else {
      url.searchParams.set('mainCategory', 'BASIC_BENEFIT');
    }
    const result = await fetchPublicDataResult<PartnerBenefitDetailResponse>(url);
    return result.status === 'success'
      ? { status: 'success', data: normalizePartnerBenefitDetail(result.data) }
      : result;
  }
);

export const getPublicPartnerBenefitDetail = cache(async (partnerId: number) => {
  const result = await getPublicPartnerBenefitDetailResult(partnerId);
  return result.data;
});
