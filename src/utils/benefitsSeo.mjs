const first = (value) => (Array.isArray(value) ? value[0] : value);

export const getBenefitsSeoPolicy = (query = {}) => {
  const rawPage = first(query.page);
  const parsedPage = rawPage === undefined ? 1 : Number(rawPage);
  const validPage = Number.isSafeInteger(parsedPage) && parsedPage > 0;
  const page = validPage ? parsedPage : 1;
  const hasFilters = Object.entries(query).some(([key, value]) =>
    key === 'page' ? Array.isArray(value) && value.length > 1 : value != null
  );

  return {
    page,
    canonicalPath: page > 1 ? `/benefits?page=${page}` : '/benefits',
    noIndex: hasFilters || (rawPage !== undefined && !validPage),
  };
};
