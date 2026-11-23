export type BenefitLoadStatus = 'loading' | 'ready' | 'error';
export function getBenefitRefreshState(
  hasData: boolean,
  status: BenefitLoadStatus,
  isCurrentQuery: boolean
): { hasStaleResults: boolean; isRefreshing: boolean; resultsLocked: boolean };
