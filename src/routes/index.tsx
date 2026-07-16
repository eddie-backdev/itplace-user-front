import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ResponsiveLayout from '../layouts/ResponsiveLayout';
import PublicRoute from '../features/loginPage/layouts/PublicRoute';
import RouteLoadingFallback from '../components/RouteLoadingFallback';

const MainPage = lazy(() => import('../pages/MainPage'));
const HomeRoute = lazy(() => import('../pages/HomeRoute'));
const MyPageLayout = lazy(() => import('../layouts/MyPageLayout'));
const MyInfoPage = lazy(() => import('../pages/myPage/MyInfoPage'));
const MyFavoritesPage = lazy(() => import('../pages/myPage/MyFavoritesPage'));
const AllBenefitsPage = lazy(() => import('../pages/AllBenefitsPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const PrivacyPolicyPage = lazy(() => import('../pages/PrivacyPolicyPage'));
const AccountDeletionPage = lazy(() => import('../pages/AccountDeletionPage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));
const TermsPage = lazy(() => import('../pages/TermsPage'));
const ContactPage = lazy(() => import('../pages/ContactPage'));
const FaqPage = lazy(() => import('../pages/FaqPage'));
const MembershipGuidePage = lazy(() => import('../pages/MembershipGuidePage'));
const MembershipLandingPage = lazy(() => import('../pages/MembershipLandingPage'));
const PartnerBenefitPage = lazy(() => import('../pages/PartnerBenefitPage'));
const OAuthRedirectHandler = lazy(
  () => import('../features/loginPage/layouts/OAuthRedirectHandler')
);

const withRouteLoading = (element: ReactNode) => (
  <Suspense fallback={<RouteLoadingFallback />}>{element}</Suspense>
);

const router = createBrowserRouter([
  { path: '/oauth/callback/kakao', element: withRouteLoading(<OAuthRedirectHandler />) },
  {
    element: <ResponsiveLayout />,
    children: [
      {
        path: '/login',
        element: <PublicRoute>{withRouteLoading(<LoginPage />)}</PublicRoute>,
      },
      { path: '/', element: withRouteLoading(<HomeRoute />) },
      { path: '/main', element: <Navigate to="/" replace /> },
      { path: '/map', element: withRouteLoading(<MainPage />) },
      {
        path: '/mypage',
        element: withRouteLoading(<MyPageLayout />),
        children: [
          { path: 'info', element: withRouteLoading(<MyInfoPage />) },
          { path: 'favorites', element: withRouteLoading(<MyFavoritesPage />) },
          { path: 'history', element: <Navigate to="/mypage/favorites" replace /> },
        ],
      },
      { path: '/benefits', element: withRouteLoading(<AllBenefitsPage />) },
      {
        path: '/benefits/partners/:partnerId/:partnerSlug',
        element: withRouteLoading(<PartnerBenefitPage />),
      },
      { path: '/membership', element: withRouteLoading(<MembershipLandingPage />) },
      { path: '/membership/:carrierSlug', element: withRouteLoading(<MembershipLandingPage />) },
      { path: '/about', element: withRouteLoading(<AboutPage />) },
      { path: '/guide', element: withRouteLoading(<MembershipGuidePage />) },
      { path: '/faq', element: withRouteLoading(<FaqPage />) },
      { path: '/contact', element: withRouteLoading(<ContactPage />) },
      { path: '/terms', element: withRouteLoading(<TermsPage />) },
      { path: '/privacy', element: withRouteLoading(<PrivacyPolicyPage />) },
      { path: '/account-deletion', element: withRouteLoading(<AccountDeletionPage />) },
    ],
  },
  {
    path: '*',
    element: withRouteLoading(<NotFoundPage />),
  },
]);

export default router;
