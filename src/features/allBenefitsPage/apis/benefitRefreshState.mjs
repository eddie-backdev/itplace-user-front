export const getBenefitRefreshState = (hasData, status, isCurrentQuery) => {
  const hasStaleResults = hasData && !isCurrentQuery;
  const isRefreshing =
    hasData && status !== 'error' && (hasStaleResults || status === 'loading');
  return {
    hasStaleResults,
    isRefreshing,
    resultsLocked: hasStaleResults || isRefreshing,
  };
};
