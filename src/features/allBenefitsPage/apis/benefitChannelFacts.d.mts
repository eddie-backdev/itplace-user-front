export type EffectiveBenefitUsageType = 'ONLINE' | 'OFFLINE' | 'BOTH' | 'UNKNOWN';

export function getEffectiveBenefitUsageType(
  partnerId: number | null | undefined,
  carrier: string,
  storedUsageType?: string | null
): EffectiveBenefitUsageType;

export function hasKnownStores(hasStores?: boolean | null): boolean;
