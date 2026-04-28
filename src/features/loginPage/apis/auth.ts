import api from '../../../apis/axiosInstance';
import axios from 'axios';
import { USER_API_BASE_URL } from '../../../apis/apiConfig';

const refreshApi = axios.create({
  baseURL: USER_API_BASE_URL,
  withCredentials: true,
});

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

export const login = (email: string, password: string) => {
  return refreshApi.post(
    '/api/v1/auth/login',
    { email, password },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};

export const kakaoOAuthLogin = (code: string) => {
  return api.post('/api/v1/auth/oauth/kakao', { code });
};

export const getOAuthResult = () => {
  return api.get('/api/v1/auth/oauth/result');
};
