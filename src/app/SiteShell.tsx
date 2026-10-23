'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import MobileAppTabBar from '@/components/MobileAppTabBar';
import PageScrollbarLayout from '@/components/PageScrollbarLayout';
import ScrollToTop from '@/components/ScrollToTop';
import SiteFooter from '@/components/SiteFooter';

const hasMobileTabs = (pathname: string) =>
  pathname === '/' ||
  pathname === '/map' ||
  pathname.startsWith('/benefits') ||
  pathname.startsWith('/mypage');

export default function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showTabBar = hasMobileTabs(pathname);

  return (
    <div className="itplace-site-shell min-h-screen">
      <a href="#site-content" className="skip-link">
        본문으로 건너뛰기
      </a>
      <PageScrollbarLayout />
      <ScrollToTop />
      <Header />
      <main
        id="site-content"
        tabIndex={-1}
        className={
          showTabBar ? 'min-w-0 pb-[var(--itplace-mobile-tab-bar-offset)] md:pb-0' : 'min-w-0'
        }
      >
        {children}
      </main>
      {pathname === '/' || pathname.startsWith('/places') ? <SiteFooter /> : null}
      {showTabBar ? <MobileAppTabBar /> : null}
    </div>
  );
}
