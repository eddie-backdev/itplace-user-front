import type { CarrierBenefitDetail } from './partnerBenefitModel';

export function getCarrierBenefitDisplayName(benefit: CarrierBenefitDetail): string;
export function getMembershipOptionLabel(benefit: CarrierBenefitDetail): '할인형' | '적립형' | null;
export function getSourceOptionLabel(benefit: CarrierBenefitDetail): string | null;
