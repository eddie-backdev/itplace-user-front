import api from '../../../apis/axiosInstance';
import { BenefitDetailRequest, BenefitDetailResponse } from '../types/api';

// 같은 상세정보 요청이 동시에 여러 번 발생해도 네트워크 호출은 1번만 수행한다.
const pendingBenefitDetailRequests = new Map<string, Promise<BenefitDetailResponse>>();

const getBenefitDetailRequestKey = (params: BenefitDetailRequest) =>
  [params.storeId, params.partnerId, params.mainCategory ?? '', params.carrier ?? ''].join(':');

export const getBenefitDetail = async (
  params: BenefitDetailRequest
): Promise<BenefitDetailResponse> => {
  const requestKey = getBenefitDetailRequestKey(params);
  const pendingRequest = pendingBenefitDetailRequests.get(requestKey);

  if (pendingRequest) {
    return pendingRequest;
  }

  const request = api
    .get('/api/v1/benefits/map-detail', {
      params: {
        storeId: params.storeId,
        partnerId: params.partnerId,
        ...(params.mainCategory ? { mainCategory: params.mainCategory } : {}),
        ...(params.carrier ? { carrier: params.carrier } : {}),
      },
    })
    .then((response) => response.data)
    .finally(() => {
      pendingBenefitDetailRequests.delete(requestKey);
    });

  pendingBenefitDetailRequests.set(requestKey, request);
  return request;
};

export const submitUsageAmount = (benefitId: number, amount: number, storeId: number) => {
  return api.post('/api/v1/membership-history/use', {
    benefitId,
    amount,
    storeId,
  });
};
