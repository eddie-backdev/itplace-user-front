import api from '../../apis/axiosInstance';

export interface BenefitUsageRecord {
  recordId: number;
  benefitId: number;
  partnerId: number;
  benefitName: string;
  partnerName: string;
  partnerImage: string | null;
  usedAt: string;
  savedAmountKrw: number | null;
  memo: string | null;
}

export interface BenefitUsageMonth {
  month: string;
  recordCount: number;
  totalSavedAmountKrw: number;
  unknownAmountCount: number;
  records: BenefitUsageRecord[];
}

export interface SaveBenefitUsageInput {
  benefitId: number;
  usedAt: string;
  savedAmountKrw: number | null;
  memo: string | null;
}

export interface UpdateBenefitUsageInput {
  usedAt: string;
  savedAmountKrw: number | null;
  memo: string | null;
}

interface ApiEnvelope<T> {
  data: T;
}

export async function fetchBenefitUsageMonth(month: string) {
  const response = await api.get<ApiEnvelope<BenefitUsageMonth>>('api/v1/benefit-usages', {
    params: { month },
  });
  return response.data.data;
}

export async function createBenefitUsage(input: SaveBenefitUsageInput) {
  const response = await api.post<ApiEnvelope<BenefitUsageRecord>>(
    'api/v1/benefit-usages',
    input
  );
  return response.data.data;
}

export async function updateBenefitUsage(recordId: number, input: UpdateBenefitUsageInput) {
  const response = await api.put<ApiEnvelope<BenefitUsageRecord>>(
    `api/v1/benefit-usages/${recordId}`,
    input
  );
  return response.data.data;
}

export async function deleteBenefitUsage(recordId: number) {
  await api.delete(`api/v1/benefit-usages/${recordId}`);
}
