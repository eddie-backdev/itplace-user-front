// src/routes/index.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ResponsiveLayout from '../layouts/ResponsiveLayout';
import MainPage from '../pages/MainPage';
import HomeRoute from '../pages/HomeRoute';
import MyPageLayout from '../layouts/MyPageLayout';
import MyInfoPage from '../pages/myPage/MyInfoPage';
import MyFavoritesPage from '../pages/myPage/MyFavoritesPage';
import AllBenefitsPage from '../pages/AllBenefitsPage';
import LoginPage from '../pages/LoginPage';
import NotFoundPage from '../pages/NotFoundPage';
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage';
import AccountDeletionPage from '../pages/AccountDeletionPage';
import AboutPage from '../pages/AboutPage';
import TermsPage from '../pages/TermsPage';
import ContactPage from '../pages/ContactPage';
import FaqPage from '../pages/FaqPage';
import MembershipGuidePage from '../pages/MembershipGuidePage';
import MembershipLandingPage from '../pages/MembershipLandingPage';
import PartnerBenefitPage from '../pages/PartnerBenefitPage';
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
      { path: '/', element: <HomeRoute /> },
      { path: '/main', element: <Navigate to="/" replace /> },
      { path: '/map', element: <MainPage /> },
      {
        path: '/mypage',
        element: <MyPageLayout />,
        children: [
          { path: 'info', element: <MyInfoPage /> },
          { path: 'favorites', element: <MyFavoritesPage /> },
          { path: 'history', element: <Navigate to="/mypage/favorites" replace /> },
        ],
      },
      { path: '/benefits', element: <AllBenefitsPage /> },
      { path: '/benefits/partners/:partnerId/:partnerSlug', element: <PartnerBenefitPage /> },
      { path: '/membership', element: <MembershipLandingPage /> },
      { path: '/membership/:carrierSlug', element: <MembershipLandingPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/guide', element: <MembershipGuidePage /> },
      { path: '/faq', element: <FaqPage /> },
      { path: '/contact', element: <ContactPage /> },
      { path: '/terms', element: <TermsPage /> },
      { path: '/privacy', element: <PrivacyPolicyPage /> },
      { path: '/account-deletion', element: <AccountDeletionPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
