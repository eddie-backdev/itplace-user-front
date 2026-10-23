import type { BenefitOffer } from './benefitConditions.mjs';

export function formatOfferFact(fact: NonNullable<BenefitOffer['facts']>[number]): string;
export function formatOfferFacts(facts?: NonNullable<BenefitOffer['facts']> | null): string[];
export function formatOfferRewardFacts(facts?: NonNullable<BenefitOffer['facts']> | null): string[];
