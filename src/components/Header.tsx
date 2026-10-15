'use client';

import Image from 'next/image';
import { useSelector } from 'react-redux';
import { Link, NavLink, useLocation } from '@/lib/navigation';
import type { RootState } from '@/store';
import { getLoginHref } from '@/features/loginPage/utils/returnTo.mjs';
import styles from './Header.module.css';

const links = [
  { href: '/', label: '홈', exact: true },
  { href: '/benefits', label: '전체 혜택' },
  { href: '/map', label: '내 주변 혜택', exact: true },
  { href: '/mypage/favorites', label: '관심 혜택' },
];

export default function Header() {
  const { pathname } = useLocation();
  const isAuthenticated = useSelector(
    (state: RootState) => state._persist.rehydrated && state.auth.isLoggedIn
  );
  const accountLabel = isAuthenticated ? '마이페이지' : '로그인';

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand} aria-label="잇플레이스 홈">
          <Image
            src="/images/brand/mark.svg"
            alt=""
            width={100}
            height={100}
            className={styles.brandMark}
            priority
          />
        </Link>
        <nav className={styles.nav} aria-label="주요 메뉴">
          {links.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <NavLink
                key={href}
                to={
                  href === '/mypage/favorites' && !isAuthenticated
                    ? `${getLoginHref(href)}&notice=login-required`
                    : href
                }
                prefetch={href === '/mypage/favorites' && !isAuthenticated ? true : undefined}
                end={exact}
                aria-current={active ? 'page' : undefined}
                className={`${styles.navLink}${active ? ` ${styles.active}` : ''}`}
              >
                {label}
              </NavLink>
            );
          })}
        </nav>
        <div className={styles.account}>
          <Link
            to={isAuthenticated ? '/mypage' : '/login'}
            prefetch={!isAuthenticated ? true : undefined}
            className={styles.accountLink}
            aria-label={accountLabel}
          >
            <span>{accountLabel}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
