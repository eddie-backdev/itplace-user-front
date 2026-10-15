export const OPTIONAL_SIGNUP_CARRIER = 'NONE';

export const isSignupMembershipValid = (carrier, grade, isValidCarrierGradePair) => {
  if (carrier === OPTIONAL_SIGNUP_CARRIER) return true;
  if (carrier === 'MVNO') return true;
  return Boolean(carrier && grade && isValidCarrierGradePair(carrier, grade));
};

export const getSignupMembershipPayload = (carrier, grade) =>
  carrier === OPTIONAL_SIGNUP_CARRIER
    ? { carrier: null, membershipGradeCode: null }
    : carrier === 'MVNO'
      ? { carrier: 'MVNO', membershipGradeCode: null }
      : { carrier: carrier || null, membershipGradeCode: grade || null };
