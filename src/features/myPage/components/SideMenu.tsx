import { TbUser, TbUserFilled, TbStar, TbStarFilled } from 'react-icons/tb';
import { NavLink } from 'react-router-dom';

type MenuItem = {
  to: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof TbUser;
  activeIcon: typeof TbUserFilled;
  activeClass: string;
  inactiveIconClass: string;
  mobileActiveClass: string;
};

const menuItems: MenuItem[] = [
  {
    to: '/mypage/info',
    label: '나의 회원 정보',
    shortLabel: '회원 정보',
    description: '내 프로필과 멤버십',
    icon: TbUser,
    activeIcon: TbUserFilled,
    activeClass:
      'bg-gradient-to-r from-purple04 to-purple05 text-white shadow-[0_12px_24px_rgba(113,50,245,0.24)]',
    inactiveIconClass: 'bg-white text-purple05 ring-1 ring-purple02 group-hover:bg-purple01',
    mobileActiveClass: 'bg-purple04 text-white shadow-[0_8px_18px_rgba(113,50,245,0.22)]',
  },
  {
    to: '/mypage/favorites',
    label: '나의 관심 혜택',
    shortLabel: '관심 혜택',
    description: '저장한 제휴처',
    icon: TbStar,
    activeIcon: TbStarFilled,
    activeClass:
      'bg-gradient-to-r from-accentRose to-accentRoseDark text-white shadow-[0_12px_24px_rgba(236,72,153,0.22)]',
    inactiveIconClass: 'bg-white text-accentRose ring-1 ring-rose-100 group-hover:bg-rose-50',
    mobileActiveClass: 'bg-accentRose text-white shadow-[0_8px_18px_rgba(236,72,153,0.22)]',
  },
];

export default function SideMenu() {
  return (
    <>
      {/* ✅ 데스크탑용 사이드 메뉴*/}
      <aside className="sticky top-[52px] self-stretch w-full max-w-[240px] min-w-[220px] bg-white/95 rounded-[20px] shadow-[0_10px_28px_rgba(16,17,20,0.07)] border border-white/80 px-3 py-5 max-xl:max-w-[220px] max-xl:min-w-[200px] max-xlg:max-w-[190px] max-xlg:min-w-[160px] max-xlg:px-3 max-md:hidden">
        <div className="px-2 pb-5 max-xlg:px-1">
          <p className="inline-flex rounded-full bg-purple01 px-2.5 py-1 text-caption-2 font-bold tracking-[0.12em] text-purple05">
            MY ITPLACE
          </p>
          <h1 className="mt-2 text-title-4 text-grey07 max-xl:text-title-5">마이잇플</h1>
          <p className="mt-1.5 text-body-5 leading-5 text-grey05 max-xlg:hidden">
            내 회원 정보와 관심 혜택을 한 곳에서 확인해요.
          </p>
        </div>
        <nav className="flex flex-col gap-2" aria-label="마이페이지 메뉴">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const ActiveIcon = item.activeIcon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group flex min-h-[50px] items-center gap-2.5 rounded-[16px] px-3 py-2 transition-all duration-200 max-xl:min-h-[48px] max-xlg:px-2 ${
                    isActive
                      ? `${item.activeClass} max-xl:text-title-7 max-lg:text-body-2-bold`
                      : 'border border-grey02/80 bg-grey01/70 text-grey06 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] hover:border-purple02 hover:bg-white hover:text-grey07 hover:shadow-[0_8px_18px_rgba(16,17,20,0.07)] max-xl:text-title-7 max-lg:text-body-2'
                  }`
                }
              >
                {({ isActive }) => {
                  const CurrentIcon = isActive ? ActiveIcon : Icon;
                  return (
                    <>
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[14px] transition max-xlg:hidden ${
                          isActive ? 'bg-white/20' : item.inactiveIconClass
                        }`}
                      >
                        <CurrentIcon size={20} strokeWidth={isActive ? 1.3 : 1.5} />
                      </div>
                      <span className="min-w-0 max-xlg:mx-auto">
                        <span className="block truncate text-body-2-bold">{item.label}</span>
                        <span
                          className={`mt-0.5 block truncate text-caption-2 max-xlg:hidden ${
                            isActive ? 'text-white/75' : 'text-grey04'
                          }`}
                        >
                          {item.description}
                        </span>
                      </span>
                    </>
                  );
                }}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* ✅ 모바일용 상단 탭 */}
      <aside className="fixed left-0 top-[53px] z-50 hidden w-full border-b border-grey02 bg-white/95 px-3 py-2 shadow-[0_8px_24px_rgba(16,17,20,0.06)] backdrop-blur max-md:block">
        <nav className="mx-auto grid max-w-[420px] grid-cols-2 gap-2" aria-label="마이페이지 탭">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const ActiveIcon = item.activeIcon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex h-10 items-center justify-center gap-1.5 rounded-[14px] px-2 text-body-4 font-semibold transition active:scale-[0.98] ${
                    isActive
                      ? item.mobileActiveClass
                      : 'border border-grey02 bg-grey01 text-grey06 hover:border-purple02 hover:bg-white hover:text-purple05'
                  }`
                }
              >
                {({ isActive }) => {
                  const CurrentIcon = isActive ? ActiveIcon : Icon;
                  return (
                    <>
                      <CurrentIcon size={17} strokeWidth={isActive ? 1.4 : 1.7} />
                      <span className="truncate">{item.shortLabel}</span>
                    </>
                  );
                }}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
