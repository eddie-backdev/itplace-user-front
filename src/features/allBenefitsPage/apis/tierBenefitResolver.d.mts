export interface TierBenefitLike {
  carrier?: string | null;
  grade: string;
  context: string;
  isAll: boolean;
}

export function getApplicableTierBenefits<T extends TierBenefitLike>(
  tierBenefits: T[],
  carrier?: string | null,
  grade?: string | null
): T[];
