import { Link, Navigate, useLocation } from '@/lib/navigation';
import type { ReactNode } from 'react';
import SideMenu from '../features/myPage/components/SideMenu';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import MobileHeader from '../components/MobileHeader';
import RouteLoadingFallback from '../components/RouteLoadingFallback';
import { getLoginHref } from '../features/loginPage/utils/returnTo.mjs';
import { TbCalendarEvent, TbHeart, TbIdBadge2 } from 'react-icons/tb';
import styles from './MyPageLayout.module.css';

const guestFeatures = [
  {
    title: '멤버십 프로필',
    description: '통신사와 등급을 저장해 내 조건의 혜택을 확인해요.',
    icon: TbIdBadge2,
  },
  {
    title: '관심 혜택',
    description: '자주 찾는 혜택을 저장해 빠르게 다시 볼 수 있어요.',
    icon: TbHeart,
  },
  {
    title: '사용 기록',
    description: '직접 기록한 이용 내역과 절약액을 모아봐요.',
    icon: TbCalendarEvent,
  },
];

export default function MyPageLayout({ children }: { children: ReactNode }) {
  const { pathname, search, hash } = useLocation();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const isAuthRehydrated = useSelector((state: RootState) => state._persist.rehydrated);
  const currentPath = `${pathname}${search}${hash}`;
  const isFavorites = pathname === '/mypage/favorites' || pathname.startsWith('/mypage/favorites/');
  const isActivity = pathname.endsWith('/activity');
  const isMembership = pathname.endsWith('/membership');
  const isSettings = pathname.endsWith('/settings');
  const pageTitle = isFavorites
    ? '관심 혜택'
    : isActivity
      ? '사용 기록'
      : isMembership
        ? '멤버십'
        : isSettings
          ? '설정'
          : pathname === '/mypage'
            ? '마이페이지'
            : '프로필';
  const guestTitle = isActivity
    ? '사용한 혜택과 절약액을 기록하세요'
    : pathname === '/mypage'
      ? '내 멤버십과 혜택 기록을 한눈에 확인하세요'
      : isSettings
        ? '계정 보안을 관리하세요'
        : '내 멤버십을 한 번에 관리하세요';
  const guestDescription = isActivity
    ? '직접 기록한 이용 내역과 절약액을 한곳에서 모아볼 수 있어요.'
    : pathname === '/mypage'
      ? '멤버십 프로필, 관심 혜택과 이번 달 사용 기록을 관리할 수 있어요.'
      : isSettings
        ? '비밀번호 변경과 휴대폰 인증, 회원 탈퇴를 관리할 수 있어요.'
        : isMembership
          ? '내 통신사와 등급에 맞는 혜택을 찾아보세요.'
          : '회원 정보와 통신사 멤버십을 한곳에서 확인하고 관리할 수 있어요.';

  if (isAuthRehydrated && !isLoggedIn && isFavorites) {
    return <Navigate to={getLoginHref(currentPath)} replace />;
  }

  return (
    <div className="min-h-screen bg-warmCanvas">
      <div className="fixed left-0 top-0 z-[9999] hidden w-full max-md:block">
        <MobileHeader title={isFavorites ? '관심 혜택' : '마이페이지'} />
      </div>
      {!isAuthRehydrated ? (
        <div className={`${styles.page} ${styles.loading}`}>
          <RouteLoadingFallback />
        </div>
      ) : !isLoggedIn ? (
        <div className={styles.page}>
          <SideMenu />
          <div className={styles.guestContent}>
            <header className="mb-6 max-md:mb-4">
              <h1 className="text-balance text-[32px] font-bold leading-tight tracking-[-0.035em] text-ink max-md:text-2xl">
                {pageTitle}
              </h1>
            </header>
            <section
              aria-labelledby="mypage-login-heading"
              className="overflow-hidden rounded-2xl border border-warmBorder bg-warmSurface lg:grid lg:grid-cols-[0.92fr_1.08fr]"
            >
              <div className="flex flex-col items-start px-6 py-8 sm:px-10 sm:py-10 max-md:px-5 max-md:py-5">
                <h2
                  id="mypage-login-heading"
                  className="text-balance break-keep text-[24px] font-bold leading-snug text-ink max-md:text-xl"
                >
                  {guestTitle}
                </h2>
                <p className="mt-3 max-w-[42ch] break-keep text-[15px] leading-7 text-grey05 max-md:mt-2 max-md:text-sm max-md:leading-[21px]">
                  {guestDescription}
                </p>
                <Link
                  to={getLoginHref(currentPath)}
                  className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand px-6 text-sm font-bold text-white transition-colors hover:bg-brandStrong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 max-md:mt-4 md:w-auto"
                >
                  로그인하기
                </Link>
                <p className="mt-3 text-sm text-grey05">
                  카카오 또는 이메일로 로그인할 수 있어요
                </p>
              </div>
              <div className="bg-warmCanvas px-6 py-7 sm:px-9 sm:py-9 max-md:border-t max-md:px-4 max-md:py-4">
                <h3 className="mb-2 text-sm font-bold text-ink">
                  로그인하면 이용할 수 있어요
                </h3>
                <ul className="divide-y divide-warmBorder max-md:grid max-md:grid-cols-3 max-md:divide-x max-md:divide-y-0">
                  {guestFeatures.map(({ title, description, icon: Icon }) => (
                    <li
                      key={title}
                      className="flex gap-3 py-4 first:pt-3 last:pb-3 max-md:flex-col max-md:items-center max-md:gap-1.5 max-md:py-0 max-md:text-center max-md:first:pt-0 max-md:last:pb-0"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warmSurface text-accent max-md:mt-0 max-md:h-8 max-md:w-8">
                        <Icon
                          aria-hidden="true"
                          className="h-5 w-5 max-md:h-[18px] max-md:w-[18px]"
                        />
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-ink max-md:text-xs">{title}</h4>
                        <p className="mt-1 break-keep text-sm leading-6 text-grey05 max-md:hidden">
                          {description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 px-1 py-2 max-md:mt-2 max-md:justify-center max-md:py-0">
              <p className="text-sm text-grey05 max-md:hidden">
                먼저 어떤 혜택이 있는지 살펴보세요
              </p>
              <Link
                to="/benefits"
                className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-bold text-accent underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                혜택 둘러보기
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.page}>
          <SideMenu />
          <div className={styles.content}>{children}</div>
        </div>
      )}
    </div>
  );
}
