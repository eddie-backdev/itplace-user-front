export const groupFavoriteTiersByCarrier = (tiers = []) => {
  const groups = new Map();

  for (const tier of tiers) {
    const carrier = tier.carrier ?? null;
    if (!groups.has(carrier)) groups.set(carrier, []);
    groups.get(carrier).push(tier);
  }

  return Array.from(groups, ([carrier, groupedTiers]) => ({ carrier, tiers: groupedTiers }));
};

export const isFavoriteTierApplicableToProfile = (
  tier,
  userCarrier,
  userGrade,
  isGradeApplicableToProfile
) => {
  if (!userCarrier || !userGrade || tier.carrier !== userCarrier) return false;
  if (tier.isAll) return true;

  return isGradeApplicableToProfile({
    benefitCarrier: tier.carrier,
    benefitGrade: tier.grade,
    userCarrier,
    userGrade,
  });
};
