'use client';

import { ReactNode } from 'react';
import { Link, useLocation } from '@/lib/navigation';
import { TbArrowLeft } from 'react-icons/tb';
import SiteFooter from './SiteFooter';
import styles from './InfoPageShell.module.css';

type PageContentsLink = { id: string; label: string };
type RelatedPageLink = { label: string; to: string };

type InfoPageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  contents?: PageContentsLink[];
  relatedLinks?: RelatedPageLink[];
};

const sections = [
  {
    label: '서비스 안내',
    links: [
      { label: '혜택 이용 가이드', to: '/guide' },
      { label: '자주 묻는 질문', to: '/faq' },
      { label: '문의', to: '/contact' },
    ],
  },
  {
    label: '정책',
    links: [
      { label: '이용약관', to: '/terms' },
      { label: '개인정보처리방침', to: '/privacy' },
      { label: '계정 삭제 안내', to: '/account-deletion' },
    ],
  },
];

const InfoPageShell = ({
  eyebrow,
  title,
  description,
  children,
  contents,
  relatedLinks,
}: InfoPageShellProps) => {
  const { pathname } = useLocation();

  return (
    <div className={styles.page}>
      <nav className={styles.mobileNav} aria-label="서비스 탐색">
        <Link to="/">
          <TbArrowLeft aria-hidden="true" />
          홈으로
        </Link>
        <span aria-hidden="true">도움말</span>
      </nav>
      <div className={styles.layout}>
        <nav className={styles.sidebar} aria-label="도움말 메뉴">
          {sections.map((section) => (
            <div className={styles.navSection} key={section.label}>
              <h2>{section.label}</h2>
              {section.links.map((item) => {
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={`${styles.navLink}${active ? ` ${styles.active}` : ''}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.main}>
          <header className={styles.header}>
            {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
            <h1>{title}</h1>
            <p className={styles.description}>{description}</p>
          </header>
          {contents?.length ? (
            <nav className={styles.contents} aria-label="이 페이지의 항목">
              {contents.map((item) => (
                <a key={item.id} href={`#${item.id}`}>
                  {item.label}
                </a>
              ))}
            </nav>
          ) : null}
          <div className={styles.article}>{children}</div>
          {relatedLinks?.length ? (
            <nav className={styles.related} aria-label="관련 안내">
              <span>관련 안내</span>
              {relatedLinks.map((item) => (
                <Link key={item.to} to={item.to}>
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
};

export default InfoPageShell;
