export const isCanonicalPartnerSlug = (requestedSlug, canonicalSlug) => {
  let decodedSlug = requestedSlug;
  try {
    decodedSlug = decodeURIComponent(requestedSlug);
  } catch {
    // Keep malformed paths eligible for a canonical redirect.
  }
  return decodedSlug === canonicalSlug;
};
