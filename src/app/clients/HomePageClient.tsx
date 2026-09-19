'use client';

import dynamic from 'next/dynamic';
import RouteLoadingFallback from '@/components/RouteLoadingFallback';
import type { PartnerBenefitItem } from '@/features/allBenefitsPage/apis/allBenefitsApi';

const HomeRoute = dynamic<{ initialPartners?: PartnerBenefitItem[] | null }>(
  () => import('@/screens/HomeRoute'),
  { loading: () => <RouteLoadingFallback /> }
);

export default HomeRoute;
