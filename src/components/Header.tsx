'use client';

import Image from 'next/image';
import { TbUser } from 'react-icons/tb';
import { Link, NavLink, useLocation } from '@/lib/navigation';
import styles from './Header.module.css';

const links = [
  { href: '/', label: '발견하기', exact: true },
  { href: '/benefits', label: '혜택찾기' },
  { href: '/map', label: '지도', exact: true },
  { href: '/mypage/favorites', label: '저장한 혜택' },
];

export default function Header() {
  const { pathname } = useLocation();
  const layout = pathname.startsWith('/mypage')
    ? 'account'
    : ['/guide', '/faq', '/contact', '/terms', '/privacy', '/about', '/account-deletion'].includes(
          pathname
        )
      ? 'support'
      : 'default';

  return (
    <header className={styles.header}>
      <div className={styles.inner} data-layout={layout}>
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
                to={href}
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
          <Link to="/mypage" className={styles.accountLink} aria-label="마이페이지">
            <span className={styles.accountIcon} aria-hidden="true">
              <TbUser size={18} />
            </span>
            <span>마이페이지</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
