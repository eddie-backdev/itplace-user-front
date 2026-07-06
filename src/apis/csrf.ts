import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { USER_API_BASE_URL } from './apiConfig';

type CsrfResponse = {
  data?: {
    headerName?: string;
    token?: string;
  };
};

const DEFAULT_CSRF_HEADER_NAME = 'X-XSRF-TOKEN';
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const unsafeMethods = new Set(['post', 'put', 'patch', 'delete']);

let csrfHeaderName = DEFAULT_CSRF_HEADER_NAME;
let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

export const clearCsrfToken = () => {
  csrfToken = null;
  csrfTokenPromise = null;
};

export const isUnsafeMethod = (method?: string) =>
  unsafeMethods.has((method ?? 'get').toLowerCase());

const readCookie = (name: string) => {
  if (typeof document === 'undefined') return null;

  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${encodeURIComponent(name)}=`));

  if (!cookie) return null;

  const [, value] = cookie.split('=');
  return value ? decodeURIComponent(value) : null;
};

export const ensureCsrfToken = async () => {
  const cookieToken = readCookie(CSRF_COOKIE_NAME);
  if (cookieToken) {
    csrfToken = cookieToken;
    return cookieToken;
  }

  if (csrfToken) {
    return csrfToken;
  }

  if (!csrfTokenPromise) {
    csrfTokenPromise = axios
      .get<CsrfResponse>('/api/v1/auth/csrf', {
        baseURL: USER_API_BASE_URL,
        withCredentials: true,
        headers: { Accept: 'application/json' },
      })
      .then((response) => {
        const issuedToken = response.data.data?.token;
        if (!issuedToken) {
          throw new Error('CSRF 토큰 응답이 비어 있습니다.');
        }

        csrfHeaderName = response.data.data?.headerName || DEFAULT_CSRF_HEADER_NAME;
        csrfToken = issuedToken;
        return issuedToken;
      })
      .finally(() => {
        csrfTokenPromise = null;
      });
  }

  return csrfTokenPromise;
};

export const attachCsrfHeader = async (config: InternalAxiosRequestConfig) => {
  if (!isUnsafeMethod(config.method) || config.url?.includes('/api/v1/auth/csrf')) {
    return config;
  }

  const token = await ensureCsrfToken();
  const headers = AxiosHeaders.from(config.headers);
  headers.set(csrfHeaderName, token);
  config.headers = headers;
  return config;
};
