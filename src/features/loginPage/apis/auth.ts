import api from '../../../apis/axiosInstance';
import axios from 'axios';
import { USER_API_BASE_URL } from '../../../apis/apiConfig';
import { attachCsrfHeader, clearCsrfToken } from '../../../apis/csrf';

const refreshApi = axios.create({
  baseURL: USER_API_BASE_URL,
  withCredentials: true,
});

refreshApi.interceptors.request.use(attachCsrfHeader);

export const refreshToken = () => {
  return refreshApi.post(
    '/api/v1/auth/reissue',
    {},
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};

export const login = async (email: string, password: string) => {
  const response = await refreshApi.post(
    '/api/v1/auth/login',
    { email, password },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  clearCsrfToken();
  return response;
};

export const kakaoOAuthLogin = (code: string) => {
  return api.post('/api/v1/auth/oauth/kakao', { code });
};

export const getOAuthResult = () => {
  return api.get('/api/v1/auth/oauth/result');
};
