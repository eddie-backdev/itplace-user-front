export const OPTIONAL_SIGNUP_CARRIER: 'NONE';

export function isSignupMembershipValid(
  carrier: string,
  grade: string,
  isValidCarrierGradePair: (carrier?: string | null, grade?: string | null) => boolean
): boolean;

export function getSignupMembershipPayload(
  carrier: string,
  grade: string
): { carrier: string | null; membershipGradeCode: string | null };
