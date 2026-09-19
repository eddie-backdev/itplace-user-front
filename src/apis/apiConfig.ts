const configuredUserApiBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL?.trim();

if (process.env.NODE_ENV === 'production' && !configuredUserApiBaseUrl) {
  throw new Error('NEXT_PUBLIC_APP_BASE_URL 환경 변수가 필요합니다.');
}

export const USER_API_BASE_URL = configuredUserApiBaseUrl || 'http://localhost:8080/';
