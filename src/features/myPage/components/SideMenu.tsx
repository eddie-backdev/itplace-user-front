import {
  TbUser,
  TbUserFilled,
  TbStar,
  TbStarFilled,
  TbClockHour4,
  TbClockHour4Filled,
} from 'react-icons/tb';
import { NavLink } from 'react-router-dom';

const menuItems = [
  {
    to: '/mypage/info',
    label: '나의 회원 정보',
    icon: TbUser, // inactive icon
    activeIcon: TbUserFilled, // active icon
  },
  {
    to: '/mypage/favorites',
    label: '나의 관심 혜택',
    icon: TbStar,
    activeIcon: TbStarFilled,
  },
  {
    to: '/mypage/history',
    label: '혜택 사용 이력',
    icon: TbClockHour4,
    activeIcon: TbClockHour4Filled,
  },
];

export default function SideMenu() {
  return (
    <>
      {/* ✅ 데스크탑용 사이드 메뉴*/}
      <aside className="sticky top-[24px] max-h-[620px] max-xlg:max-h-none w-full max-w-[270px] min-w-[250px] bg-white/95 rounded-[24px] shadow-[0_14px_36px_rgba(37,9,97,0.09)] border border-white/80 pt-[34px] pb-[26px] px-4 max-xl:max-w-[240px] max-xl:min-w-[220px] max-xl:pt-[30px] max-xlg:max-w-[200px] max-xlg:min-w-[170px] max-xlg:px-3 max-xlg:pt-[24px] max-md:hidden">
        <div className="px-3 pb-[30px] max-xl:pb-[24px] max-xlg:px-1">
          <p className="text-body-3-bold text-purple03">IT:PLACE</p>
          <h1 className="mt-1 text-title-2 text-purple06 max-xl:text-title-3 max-xlg:text-title-5">
            마이잇플
          </h1>
          <p className="mt-2 text-body-4 text-grey04 max-xlg:hidden">
            내 혜택 정보와 이용 기록을 한 곳에서 확인해요.
          </p>
        </div>
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const ActiveIcon = item.activeIcon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center h-[52px] gap-3 rounded-[16px] px-3 transition-all max-xl:h-[50px] max-xlg:px-3 ${
                    isActive
                      ? 'bg-purple04 text-white text-title-6 shadow-[0_12px_24px_rgba(118,56,250,0.25)] max-xl:text-title-7 max-lg:text-body-2-bold'
                      : 'bg-white text-grey04 text-title-6 hover:bg-purple01/60 hover:text-purple05 max-xl:text-title-7 max-lg:text-body-2'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 max-xlg:hidden">
                        <ActiveIcon size={24} strokeWidth={1} />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-grey01 text-grey04 transition group-hover:bg-white group-hover:text-purple04 max-xlg:hidden">
                        <Icon size={24} strokeWidth={1} />
                      </div>
                    )}
                    <span className="max-xlg:mx-auto">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* ✅ 모바일용 사이드 메뉴: 아이콘 제거 + 라벨 변경 + 상단 고정 */}
      <aside
        className="
          hidden
          max-md:flex
          fixed top-0 z-50 mt-[53px]
          w-full
          bg-white
          border-b border-grey03
        "
      >
        {[
          { to: '/mypage/info', label: '회원 정보' },
          { to: '/mypage/favorites', label: '관심 혜택' },
          { to: '/mypage/history', label: '혜택 이력' },
        ].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 flex items-center justify-center py-3 text-body-3 font-medium transition
              ${isActive ? 'text-purple04 border-b-2 border-purple04 font-semibold' : 'text-grey04'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </aside>
    </>
  );
}
