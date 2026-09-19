'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import MobileAppTabBar from '@/components/MobileAppTabBar';
import ScrollToTop from '@/components/ScrollToTop';

const isAppTabPath = (pathname: string) =>
  pathname === '/' ||
  pathname === '/map' ||
  pathname.startsWith('/benefits') ||
  pathname.startsWith('/mypage');

export default function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showTabBar = isAppTabPath(pathname);

  return (
    <div
      className={`min-h-screen md:flex ${
        showTabBar ? 'max-md:bg-warmCanvas' : 'max-md:bg-warmSurface'
      }`}
    >
      <ScrollToTop />
      <div className="max-md:hidden">
        <Header />
      </div>
      <main
        className={`min-w-0 flex-1 md:ml-[88px] ${
          showTabBar ? 'max-md:pb-[var(--itplace-mobile-tab-bar-offset,64px)]' : ''
        }`}
      >
        {children}
      </main>
      {showTabBar ? <MobileAppTabBar /> : null}
    </div>
  );
}
