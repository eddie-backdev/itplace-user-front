export const BENEFIT_CONDITION_FIELDS = [
  ['products', '대상 상품'],
  ['availability', '이용 가능일'],
  ['limits', '이용 한도'],
  ['usage', '이용 방법'],
  ['exclusions', '제외 조건'],
];

const UNKNOWN_TEXT = '공식 안내에서 확인';
const LEGACY_LIMIT_UNKNOWN_VALUES = new Set([
  '제한없음',
  '이용 방법에서 횟수·한도 확인',
  '횟수·제외 조건은 상세 확인',
]);

export const getBenefitConditionRows = (conditions, legacyLimit, tierConditions = []) => {
  const tiers = Array.isArray(tierConditions)
    ? tierConditions.filter((tier) => typeof tier?.context === 'string' && tier.context.trim())
    : [];
  const tierRows = tiers.flatMap((tier) => [
    {
      key: `benefit-${tier.context}`,
      label: '혜택',
      values: [tier.context.trim()],
      isUnknown: false,
    },
    {
      key: `grades-${tier.context}`,
      label: '적용 등급',
      values: Array.isArray(tier.grades) && tier.grades.length ? tier.grades : [UNKNOWN_TEXT],
      isUnknown: !Array.isArray(tier.grades) || tier.grades.length === 0,
    },
  ]);

  const missingTierRows = tiers.length
    ? []
    : [
        { key: 'benefit', label: '혜택', values: [UNKNOWN_TEXT], isUnknown: true },
        { key: 'grades', label: '적용 등급', values: [UNKNOWN_TEXT], isUnknown: true },
      ];

  return [
    ...tierRows,
    ...missingTierRows,
    ...BENEFIT_CONDITION_FIELDS.map(([key, label]) => {
      const values = Array.isArray(conditions?.[key])
        ? conditions[key]
            .filter((value) => typeof value === 'string')
            .map((value) => value.trim())
            .filter(Boolean)
        : [];
      const normalizedLegacyLimit = typeof legacyLimit === 'string' ? legacyLimit.trim() : '';
      const fallbackLimit =
        key === 'limits' &&
        normalizedLegacyLimit &&
        !LEGACY_LIMIT_UNKNOWN_VALUES.has(normalizedLegacyLimit)
          ? [normalizedLegacyLimit]
          : [];

      return {
        key,
        label,
        values: values.length ? values : fallbackLimit.length ? fallbackLimit : [UNKNOWN_TEXT],
        isUnknown: values.length === 0 && fallbackLimit.length === 0,
      };
    }),
  ];
};

export const getSingleOfferRewardSummary = (
  offerResolution,
  offerCount,
  isEligible,
  tierConditions = []
) => {
  if (offerResolution !== 'SINGLE' || offerCount !== 1 || !isEligible) return undefined;
  const contexts = Array.isArray(tierConditions)
    ? tierConditions
        .filter((tier) => Array.isArray(tier?.grades) && tier.grades.length > 0)
        .map((tier) => tier.context?.trim())
        .filter(Boolean)
    : [];
  return contexts.length ? contexts.join(' · ') : undefined;
};

export const getBenefitOffers = (conditions) =>
  Array.isArray(conditions?.offers)
    ? conditions.offers.filter(
        (offer) => offer && typeof offer.key === 'string' && offer.key.trim()
      )
    : [];

export const hasOverallBenefitSummaryContent = (rows, channelDecision) =>
  Boolean(rows?.length || channelDecision?.evidence?.length);

export const getBenefitOfferEligibility = (
  offer,
  hasSelectedGrade,
  matchesSelectedGrade,
  offerResolution
) => {
  if (offerResolution === 'UNRESOLVED') return 'UNKNOWN';
  if (offer?.allGrades === true) return 'ELIGIBLE';
  if (!hasSelectedGrade || !Array.isArray(offer?.gradeCodes) || offer.gradeCodes.length === 0) {
    return 'UNKNOWN';
  }
  return matchesSelectedGrade ? 'ELIGIBLE' : 'INELIGIBLE';
};

export const partitionBenefitOffers = (offers, getEligibility, showAll = false) =>
  offers.reduce(
    (result, offer) => {
      if (showAll || getEligibility(offer) !== 'INELIGIBLE') result.visible.push(offer);
      else result.otherGrades.push(offer);
      return result;
    },
    { visible: [], otherGrades: [] }
  );

export const formatSourceCapturedDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul',
  }).format(date);
};
