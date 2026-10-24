import type { BenefitOffer } from '../features/allBenefitsPage/apis/benefitConditions.mjs';

export function getScopedBenefitHeadline(input: {
  offers?: Pick<BenefitOffer, 'title' | 'facts'>[];
  offerResolution?: 'SINGLE' | 'SCOPED' | 'PARTIAL' | 'UNRESOLVED';
  eligibleTierContexts?: string[];
}): string;
