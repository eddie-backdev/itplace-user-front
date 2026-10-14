import { Link, useLocation } from '@/lib/navigation';
import type { ReactNode } from 'react';
import SideMenu from '../features/myPage/components/SideMenu';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import MobileHeader from '../components/MobileHeader';
import RouteLoadingFallback from '../components/RouteLoadingFallback';
import { getLoginHref } from '../features/loginPage/utils/returnTo.mjs';
import { TbCalendarEvent, TbHeart, TbIdBadge2, TbUserCircle } from 'react-icons/tb';

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

  // ✅ 모바일 레이아웃을 위한 조건분기
  const isWhiteLayout = pathname.startsWith('/mypage/favorites');

  // ✅ Redux에서 로그인 상태 가져오기
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const isAuthRehydrated = useSelector((state: RootState) => state._persist.rehydrated);
  const currentPath = `${pathname}${search}${hash}`;

  if (!isAuthRehydrated) {
    return (
      <div className="min-h-screen bg-warmCanvas">
        <div className="hidden fixed top-0 left-0 w-full z-[9999] max-md:block">
          <MobileHeader title="마이잇플" />
        </div>
        <div className="workspace-container mx-auto flex min-h-screen items-center justify-center max-md:pt-[96px]">
          <RouteLoadingFallback />
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    const isInfoPage = pathname === '/mypage/info';
    const isActivityPage = pathname === '/mypage/activity';
    const pageTitle = isWhiteLayout ? '관심 혜택' : isActivityPage ? '사용 기록' : '회원 정보';
    const title = isWhiteLayout
      ? '자주 쓰는 혜택을\n모아두세요'
      : isActivityPage
        ? '사용한 혜택과\n절약액을 기록하세요'
        : '내 멤버십을\n한 번에 관리하세요';
    const description = isWhiteLayout
      ? '관심 혜택을 저장해 두고 다음에 더 빠르게 찾아보세요.'
      : isInfoPage
        ? '회원 정보와 통신사 멤버십을 한곳에서 확인하고 관리할 수 있어요.'
        : '직접 기록한 이용 내역과 절약액을 한곳에서 모아볼 수 있어요.';

    return (
      <div className="min-h-screen bg-warmCanvas max-md:min-h-0">
        <div className="hidden fixed top-0 left-0 w-full z-[9999] max-md:block">
          <MobileHeader title="마이잇플" />
        </div>
        <SideMenu />
        <div className="workspace-container mx-auto min-h-screen pb-24 pt-12 max-md:min-h-0 max-md:px-4 max-md:pb-6 max-md:pt-[130px]">
          <div className="mx-auto max-w-[1000px]">
            <header className="mb-6 max-md:mb-4">
              <h1 className="text-balance text-title-2 text-grey07 max-md:text-xl max-md:font-semibold">{pageTitle}</h1>
              <p className="mt-2 max-w-[48ch] break-keep text-body-2 leading-7 text-grey05 max-md:hidden">
                로그인하고 회원 정보와 혜택을 한곳에서 관리해 보세요.
              </p>
            </header>
            <section
              aria-labelledby="mypage-login-heading"
              className="surface-card grid overflow-hidden lg:grid-cols-[0.92fr_1.08fr]"
            >
              <div className="flex flex-col items-start px-6 py-8 sm:px-10 sm:py-10 max-md:px-5 max-md:py-5">
                <span className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brandSoft text-brandStrong max-md:hidden">
                  <TbUserCircle aria-hidden="true" className="h-7 w-7" />
                </span>
                <h2 id="mypage-login-heading" className="min-h-[2lh] max-w-[18em] text-balance break-keep text-title-3 leading-snug text-grey07 max-md:whitespace-pre-line max-md:text-xl max-md:leading-[1.3]">
                  {title}
                </h2>
                <p className="mt-3 min-h-[3lh] max-w-[42ch] break-keep text-body-2 leading-7 text-grey05 max-md:mt-2 max-md:text-sm max-md:leading-[21px]">
                  {description}
                </p>
                <Link
                  to={getLoginHref(currentPath)}
                  className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand px-6 text-body-2-bold text-white transition-colors motion-reduce:transition-none hover:bg-brandStrong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 max-md:mt-4 max-md:scroll-mt-[130px] max-md:scroll-mb-24 md:w-auto"
                >
                  로그인하기
                </Link>
                <p className="mt-3 text-body-3 text-grey05 max-md:mt-2 max-md:break-keep max-md:text-xs">카카오 또는 이메일로 로그인할 수 있어요</p>
              </div>
              <div className="bg-warmCanvas px-6 py-7 sm:px-9 sm:py-9 max-md:border-t max-md:px-4 max-md:py-4">
                <h3 className="mb-2 text-body-2-bold text-grey07 max-md:mb-2 max-md:text-sm">로그인하면 이용할 수 있어요</h3>
                <ul className="divide-y divide-warmBorder max-md:grid max-md:grid-cols-3 max-md:divide-x max-md:divide-y-0">
                  {guestFeatures.map(({ title: featureTitle, description: featureDescription, icon: Icon }) => (
                    <li key={featureTitle} className="flex gap-3 py-4 first:pt-3 last:pb-3 max-md:flex-col max-md:items-center max-md:gap-1.5 max-md:py-0 max-md:text-center max-md:first:pt-0 max-md:last:pb-0">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brandStrong max-md:mt-0 max-md:h-8 max-md:w-8">
                        <Icon aria-hidden="true" className="h-5 w-5 max-md:h-[18px] max-md:w-[18px]" />
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-body-2-bold text-grey07 max-md:text-xs">{featureTitle}</h4>
                        <p className="mt-1 break-keep text-body-3 leading-6 text-grey05 max-md:hidden">{featureDescription}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 px-1 py-2 max-md:mt-2 max-md:justify-center max-md:py-0">
              <p className="break-keep text-body-3 text-grey05 max-md:hidden">먼저 어떤 혜택이 있는지 살펴보세요</p>
              <Link
                to="/benefits"
                className="inline-flex min-h-11 items-center rounded-lg px-3 text-body-3-bold text-brandStrong underline decoration-transparent underline-offset-4 transition-colors motion-reduce:transition-none hover:decoration-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 max-md:scroll-mt-[130px] max-md:scroll-mb-24"
              >
                혜택 둘러보기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ 로그인된 경우에는 마이페이지 레이아웃 정상 렌더
  return (
    <div className="min-h-screen bg-warmCanvas">
      <div className="hidden fixed top-0 left-0 w-full z-[9999] max-md:block">
        <MobileHeader title="마이잇플" />
      </div>

      <div
        className={
          `workspace-container flex items-stretch gap-6 pb-8 pt-8 max-md:mx-0 max-md:max-h-none max-md:flex-col max-md:p-0 max-md:pt-[130px]` +
          (isWhiteLayout ? ' max-md:gap-0' : '')
        }
      >
        {/* 좌측 메뉴 */}
        <SideMenu />

        {/* 중앙+우측을 자식 페이지에서 구성 */}
        <div className="flex min-w-0 flex-1 items-stretch gap-6 max-lg:flex-col max-lg:gap-5 max-md:gap-4">
          {children}
        </div>
      </div>
    </div>
  );
}
