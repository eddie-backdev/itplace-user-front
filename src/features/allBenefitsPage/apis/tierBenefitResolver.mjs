const appliesToGrade = (tier, carrier, grade) =>
  (tier.carrier == null || tier.carrier === carrier) &&
  (tier.grade === grade ||
    (carrier === 'LGU' && tier.grade === 'VIP콕' && (grade === 'VIP' || grade === 'VVIP')));

export const getApplicableTierBenefits = (tierBenefits, carrier, grade) => {
  const contexts = new Map();
  tierBenefits.forEach((tier) => {
    const rows = contexts.get(tier.context) ?? [];
    rows.push(tier);
    contexts.set(tier.context, rows);
  });

  return [...contexts.values()].flatMap((rows) => {
    const explicitRows = rows.filter((tier) => !tier.isAll);
    if (explicitRows.length) {
      return grade
        ? explicitRows.filter((tier) => appliesToGrade(tier, carrier, grade))
        : explicitRows;
    }
    return rows.filter((tier) => tier.isAll && (tier.carrier == null || tier.carrier === carrier));
  });
};
