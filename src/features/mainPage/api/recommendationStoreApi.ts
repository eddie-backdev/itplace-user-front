import api from '../../../apis/axiosInstance';
import { RecommendationStoreResponse } from '../types/api';

export const getRecommendationStoresByPartner = async (
  partnerName: string,
  lat: number,
  lng: number,
  userLat?: number,
  userLng?: number
): Promise<RecommendationStoreResponse> => {
  const response = await api.get(`/api/v1/maps/nearby/itplace-ai`, {
    params: { partnerName, lat, lng, userLat, userLng },
  });
  return response.data;
};
