// src/App.tsx
import './App.css';
import { RouterProvider } from 'react-router-dom';
import router from './routes';
import ToastProvider from './components/ToastProvider';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './store';
import { logout } from './store/authSlice';
import { persistor } from './store';
import { refreshToken } from './features/loginPage/apis/auth';
import ChatWidget from './features/chat/components/ChatWidget';

const App = () => {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);

  useEffect(() => {
    const validateToken = async () => {
      if (isLoggedIn) {
        // OAuth 로그인 직후 토큰 설정을 위해 잠시 대기
        setTimeout(async () => {
          try {
            // refreshToken API로 토큰 유효성 검증
            await refreshToken();
          } catch {
            // 토큰이 유효하지 않으면 persist 삭제 및 로그아웃
            dispatch(logout());
            persistor.purge();
          }
        }, 1000); // 1초 대기
      }
    };

    validateToken();
  }, [dispatch, isLoggedIn]); // dispatch와 isLoggedIn 상태 변경 시 실행

  return (
    <>
      <RouterProvider router={router} />
      <ToastProvider />
      <ChatWidget />
    </>
  );
};

export default App;
