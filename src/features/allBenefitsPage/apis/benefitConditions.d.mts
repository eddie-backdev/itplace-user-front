export type BenefitConditions = Partial<
  Record<'products' | 'availability' | 'limits' | 'usage' | 'exclusions', string[]>
> & {
  offers?: BenefitOffer[];
  offerResolution?: 'SINGLE' | 'SCOPED' | 'PARTIAL' | 'UNRESOLVED';
  sourceBlocks?: BenefitSourceBlock[];
  normalizationIssues?: NormalizationIssue[];
  channelDecision?: {
    version: string;
    reason: string;
    evidence: string[];
    exclusions: string[];
  } | null;
};

export type BenefitOffer = {
  key: string;
  title: string;
  sourceText?: string | null;
  usageType: 'ONLINE' | 'OFFLINE' | 'BOTH' | 'UNKNOWN';
  gradeCodes: string[];
  allGrades: boolean | null;
  products: string[];
  availability: string[];
  limits: string[];
  usage: string[];
  exclusions: string[];
  channelEvidence: string[];
  sourcePath?: string | null;
  facts?: BenefitFact[];
};

export type BenefitSourceBlock = { path: string; parentPath: string | null; kind: string; heading: string | null; text: string };
export type NormalizationIssue = { code: string; message: string; sourceText: string | null; sourcePath: string | null };
export type BenefitFact = {
  type: string; value: number | null; unit: string | null; period: string | null;
  basisAmount: number | null; basisUnit: string | null; sharedLimitGroup: string | null;
  qualifier: 'EXACT' | 'MAX' | 'MIN'; sourceText: string; sourcePath: string | null;
};

export function getBenefitOffers(conditions?: BenefitConditions | null): BenefitOffer[];
export function hasOverallBenefitSummaryContent(
  rows: unknown[] | null | undefined,
  channelDecision: BenefitConditions['channelDecision']
): boolean;

export function getSingleOfferRewardSummary(
  offerResolution: 'SINGLE' | 'SCOPED' | 'PARTIAL' | 'UNRESOLVED' | undefined,
  offerCount: number,
  isEligible: boolean,
  tierConditions?: Array<{ grades?: string[]; context: string }>
): string | undefined;

export type BenefitOfferEligibility = 'ELIGIBLE' | 'INELIGIBLE' | 'UNKNOWN';

export function getBenefitOfferEligibility(
  offer: BenefitOffer,
  hasSelectedGrade: boolean,
  matchesSelectedGrade: boolean,
  offerResolution?: 'SINGLE' | 'SCOPED' | 'PARTIAL' | 'UNRESOLVED'
): BenefitOfferEligibility;

export function partitionBenefitOffers<T extends BenefitOffer>(
  offers: T[],
  getEligibility: (offer: T) => BenefitOfferEligibility,
  showAll?: boolean
): { visible: T[]; otherGrades: T[] };

export function getBenefitConditionRows(
  conditions?: BenefitConditions | null,
  legacyLimit?: string | null,
  tierConditions?: Array<{ grades?: string[]; context: string }>
): Array<{
  key: string;
  label: string;
  values: string[];
  isUnknown: boolean;
}>;

export function formatSourceCapturedDate(value?: string | null): string | null;
