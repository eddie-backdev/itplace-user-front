import { NextRequest, NextResponse } from 'next/server';
import { CARRIER_PAGE_CONFIGS } from '@/config/membershipPages';
import { createPartnerSlug } from '@/utils/partnerSeo';

const configuredUserApiBaseUrl =
  process.env.USER_API_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_BASE_URL?.trim() ||
  'http://localhost:8080/';

const membershipSlugs = new Set<string>(CARRIER_PAGE_CONFIGS.map((carrier) => carrier.slug));

const decodePathSegment = (segment: string) => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

const rewriteToNotFound = (request: NextRequest) => {
  const destination = request.nextUrl.clone();
  destination.pathname = '/__itplace-partner-not-found';
  return NextResponse.rewrite(destination, { status: 404 });
};

const fetchCurrentPartnerName = async (partnerId: number) => {
  try {
    const url = new URL(`/api/v1/benefits/partners/${partnerId}`, configuredUserApiBaseUrl);
    url.searchParams.set('mainCategory', 'BASIC_BENEFIT');
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    if (response.status === 404) return { status: 'not-found' as const };
    if (!response.ok) return { status: 'unavailable' as const };
    const body = (await response.json()) as { data?: { partnerName?: unknown } };
    return typeof body.data?.partnerName === 'string'
      ? { status: 'success' as const, partnerName: body.data.partnerName }
      : { status: 'not-found' as const };
  } catch {
    return { status: 'unavailable' as const };
  }
};

// OpenNext supports Edge middleware; Node.js proxy support is experimental.
export async function middleware(request: NextRequest) {
  const segments = request.nextUrl.pathname.split('/').filter(Boolean);
  if (segments[0] === 'membership' && segments.length === 2) {
    return membershipSlugs.has(segments[1])
      ? NextResponse.next()
      : rewriteToNotFound(request);
  }

  if (
    segments.length !== 4 ||
    segments[0] !== 'benefits' ||
    segments[1] !== 'partners'
  ) {
    return NextResponse.next();
  }

  const partnerIdSegment = segments[2];
  const partnerSlugSegment = segments[3];
  const partnerId = Number(partnerIdSegment);
  if (!Number.isInteger(partnerId) || partnerId <= 0) return rewriteToNotFound(request);

  const requestedSlug = decodePathSegment(partnerSlugSegment);
  // Canonical routing must use the current API name. A build-time catalog can
  // become stale after a partner rename or deletion and cause redirect loops.
  const result = await fetchCurrentPartnerName(partnerId);
  if (result.status === 'not-found') return rewriteToNotFound(request);
  if (result.status === 'unavailable') return NextResponse.next();

  const canonicalSlug = createPartnerSlug(result.partnerName);
  if (
    partnerIdSegment === String(partnerId) &&
    requestedSlug === canonicalSlug
  ) {
    return NextResponse.next();
  }

  const destination = request.nextUrl.clone();
  destination.pathname = `/benefits/partners/${partnerId}/${canonicalSlug}`;
  return NextResponse.redirect(destination, 308);
}

export const config = {
  matcher: ['/benefits/partners/:path*', '/membership/:path*'],
};
