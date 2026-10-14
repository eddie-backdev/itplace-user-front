'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      data-sidebar-collapsed={isCollapsed}
      className={`itplace-site-shell min-h-screen md:flex ${
        showTabBar ? 'max-md:bg-warmCanvas' : 'max-md:bg-warmSurface'
      }`}
    >
      <a
        href="#site-content"
        className="sr-only z-50 rounded-lg bg-brandStrong px-5 py-3 font-bold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand"
      >
        본문으로 건너뛰기
      </a>
      <ScrollToTop />
      <div className="max-md:hidden">
        <Header isCollapsed={isCollapsed} onToggle={() => setIsCollapsed((collapsed) => !collapsed)} />
      </div>
      <main
        id="site-content"
        tabIndex={-1}
        className={`min-w-0 flex-1 ml-[var(--itplace-sidebar-width)] ${
          showTabBar ? 'max-md:pb-[var(--itplace-mobile-tab-bar-offset,64px)]' : ''
        }`}
      >
        {children}
      </main>
      {showTabBar ? <MobileAppTabBar /> : null}
    </div>
  );
}
