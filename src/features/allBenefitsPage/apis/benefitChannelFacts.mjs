export const getEffectiveBenefitUsageType = (_partnerId, _carrier, storedUsageType) => {
  return storedUsageType === 'ONLINE' || storedUsageType === 'OFFLINE' || storedUsageType === 'BOTH'
    ? storedUsageType
    : 'UNKNOWN';
};

export const hasKnownStores = (hasStores) => hasStores === true;
