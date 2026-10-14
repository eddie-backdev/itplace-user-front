export type FavoriteMembershipTier = {
  carrier?: string | null;
  grade: string;
  isAll: boolean;
  context: string;
};

export type FavoriteMembershipGroup = {
  carrier: string | null;
  tiers: FavoriteMembershipTier[];
};

export type GradeProfileMatcher = (profile: {
  benefitCarrier?: string | null;
  benefitGrade?: string | null;
  userCarrier?: string | null;
  userGrade?: string | null;
}) => boolean;

export function groupFavoriteTiersByCarrier(
  tiers?: FavoriteMembershipTier[]
): FavoriteMembershipGroup[];

export function isFavoriteTierApplicableToProfile(
  tier: FavoriteMembershipTier,
  userCarrier: string | null | undefined,
  userGrade: string | null | undefined,
  isGradeApplicableToProfile: GradeProfileMatcher
): boolean;
