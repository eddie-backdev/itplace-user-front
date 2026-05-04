// src/routes/index.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ResponsiveLayout from '../layouts/ResponsiveLayout';
import MainPage from '../pages/MainPage';
import MyPageLayout from '../layouts/MyPageLayout';
import MyInfoPage from '../pages/myPage/MyInfoPage';
import MyFavoritesPage from '../pages/myPage/MyFavoritesPage';
import MyHistoryPage from '../pages/myPage/MyHistoryPage';
import AllBenefitsPage from '../pages/AllBenefitsPage';
import LoginPage from '../pages/LoginPage';
import NotFoundPage from '../pages/NotFoundPage';
import OAuthRedirectHandler from '../features/loginPage/layouts/OAuthRedirectHandler';
import PublicRoute from '../features/loginPage/layouts/PublicRoute'; // PublicRoute import

const router = createBrowserRouter([
  { path: '/oauth/callback/kakao', element: <OAuthRedirectHandler /> }, // 카카오 콜백 (독립 라우트)
  {
    element: <ResponsiveLayout />, // DefaultLayout 대신 ResponsiveLayout 사용
    children: [
      {
        // 로그인된 사용자는 접근 불가
        path: '/login',
        element: (
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        ),
      },
      { path: '/', element: <MainPage /> },
      { path: '/main', element: <Navigate to="/" replace /> },
      {
        path: '/mypage',
        element: <MyPageLayout />,
        children: [
          { path: 'info', element: <MyInfoPage /> },
          { path: 'favorites', element: <MyFavoritesPage /> },
          { path: 'history', element: <MyHistoryPage /> },
        ],
      },
      { path: '/benefits', element: <AllBenefitsPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
