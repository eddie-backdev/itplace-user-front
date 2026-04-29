import { AxiosError, AxiosRequestConfig } from 'axios';
import api from './axiosInstance';
import { refreshToken } from '../features/loginPage/apis/auth';
import { store } from '../store';
import { logout } from '../store/authSlice';
import { persistor } from '../store';

// 토큰 갱신 중인지 추적하는 플래그
let isRefreshing = false;
// 갱신 중 대기하는 요청들을 저장하는 배열
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (error: AxiosError) => void;
}> = [];

// 대기 중인 요청들을 처리하는 함수
const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// 로그아웃 처리 함수
const handleLogout = () => {
  store.dispatch(logout());
  // redux-persist 초기화
  persistor.purge();
  window.history.replaceState({ resetToLogin: true }, '', '/login');
  window.dispatchEvent(new PopStateEvent('popstate'));
};

// Interceptor 설정 함수
export const setupInterceptors = () => {
  // Response Interceptor
  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // 이미 토큰 갱신 중이면 대기열에 추가
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => {
              // 토큰 갱신 완료 후 원래 요청 재시도
              return api(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // 토큰 갱신 시도
          await refreshToken();
          processQueue(null);

          // 원래 요청 재시도
          return api(originalRequest);
        } catch (refreshError) {
          // 토큰 갱신 실패 시 로그아웃 처리
          processQueue(refreshError as AxiosError, null);
          handleLogout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};
