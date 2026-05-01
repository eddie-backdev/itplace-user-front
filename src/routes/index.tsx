// src/routes/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import ResponsiveLayout from '../layouts/ResponsiveLayout';
import LandingPage from '../pages/LandingPage';
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
  { path: '/', element: <LandingPage /> }, // 기본 라우터
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
      { path: '/main', element: <MainPage /> }, // 각 페이지별 레이아웃이나 자식 라우팅은 각자 작업하면서 자유롭게 추가
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
