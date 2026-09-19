import type { NextConfig } from 'next';

const legacyHtmlRedirects = [
  ['/about', '/about'],
  ['/guide', '/guide'],
  ['/membership', '/membership'],
  ['/membership/skt', '/membership/skt'],
  ['/membership/kt', '/membership/kt'],
  ['/membership/lguplus', '/membership/lguplus'],
  ['/faq', '/faq'],
  ['/contact', '/contact'],
  ['/terms', '/terms'],
  ['/privacy', '/privacy'],
  ['/account-deletion', '/account-deletion'],
  ['/map', '/map'],
  ['/benefits', '/benefits'],
  ['/login', '/login'],
  ['/oauth/callback/kakao', '/oauth/callback/kakao'],
  ['/mypage/info', '/mypage/info'],
  ['/mypage/favorites', '/mypage/favorites'],
] as const;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  redirects() {
    return [
      { source: '/main', destination: '/', permanent: true },
      { source: '/mypage', destination: '/mypage/info', permanent: false },
      {
        source: '/mypage/history',
        destination: '/mypage/favorites',
        permanent: false,
      },
      {
        source: '/mypage/history.html',
        destination: '/mypage/favorites',
        permanent: true,
      },
      { source: '/index.html', destination: '/', permanent: true },
      ...legacyHtmlRedirects.map(([legacyPath, destination]) => ({
        source: `${legacyPath}.html`,
        destination,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
