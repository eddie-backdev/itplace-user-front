import api from '../../../apis/axiosInstance';
import axios from 'axios';
import { USER_API_BASE_URL } from '../../../apis/apiConfig';

// refresh API용 별도 axios 인스턴스 (interceptor 없음)
const refreshApi = axios.create({
  baseURL: USER_API_BASE_URL,
  withCredentials: true,
});

//refresh token API
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

//U+ 회원 정보 불러오기기
export const loadUplusData = (phoneNumber: string) => {
  return api.post('/api/v1/auth/loadUplusData', {
    phoneNumber,
  });
};

export const kakaoOAuthLogin = (code: string) => {
  return api.post('/api/v1/auth/oauth/kakao', { code });
};

// OAuth 계정 통합 API
export const oauthAccountLink = (phoneNumber: string) => {
  return api.post('/api/v1/auth/oauth/link', { phoneNumber });
};

// Local 신규 OAuth 계정 통합
export const loadOAuthData = (phoneNumber: string) => {
  return api.post('/api/v1/auth/loadOAuthData', {
    phoneNumber,
  });
};

// Local-OAuth 통합 회원가입
export const signUpWithOAuthLink = (data: {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  passwordConfirm: string;
  gender: string;
  birthday: string;
  membershipId: string;
}) => {
  return api.post('/api/v1/auth/link', data);
};

// OAuth 결과 조회
export const getOAuthResult = () => {
  return api.get('/api/v1/auth/oauth/result');
};
