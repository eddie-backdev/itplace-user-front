import api from './axiosInstance';

export interface InquiryCreateRequest {
  category: string;
  title: string;
  content: string;
}

export const createInquiry = async (request: InquiryCreateRequest) => {
  return api.post('/api/v1/inquiries', request);
};
