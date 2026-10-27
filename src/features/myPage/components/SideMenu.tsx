import Link from 'next/link';
import { NavLink } from '@/lib/navigation';

const menuItems = [
  { to: '/mypage', label: '요약', exact: true },
  { to: '/mypage/info', label: '프로필' },
  { to: '/mypage/membership', label: '멤버십' },
  { to: '/mypage/favorites', label: '관심 혜택' },
  { to: '/mypage/activity', label: '사용 기록' },
  { to: '/mypage/settings', label: '설정' },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 items-center justify-between rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
    isActive ? 'bg-brandSoft text-accentStrong' : 'text-grey06 hover:bg-warmCanvas hover:text-ink'
  }`;

export default function SideMenu() {
  return (
    <>
      <aside className="sticky top-[104px] mt-8 hidden self-start border-r border-warmBorder pr-6 md:block">
        <p className="mb-3 px-3 text-[13px] font-bold text-grey05">마이페이지</p>
        <nav aria-label="마이페이지 메뉴" className="grid gap-1">
          {menuItems.map(({ to, label, exact }) => (
            <NavLink key={to} to={to} end={exact} className={linkClass}>
              {label}
              <span aria-hidden="true" className="text-lg font-normal text-grey04">
                ›
              </span>
            </NavLink>
          ))}
        </nav>
        <Link
          href="/faq"
          className="mt-6 flex min-h-11 items-center justify-center rounded-xl border border-warmBorder px-3 text-sm font-semibold text-accent hover:bg-warmSurface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          도움이 필요하신가요?
        </Link>
      </aside>

      <nav
        aria-label="마이페이지 메뉴"
        className="fixed left-0 top-[53px] z-40 w-full overflow-x-auto border-b border-warmBorder bg-warmSurface px-2 py-1.5 md:hidden"
      >
        <div className="mx-auto flex min-w-max justify-center gap-1">
          {menuItems.map(({ to, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex min-h-11 shrink-0 items-center justify-center rounded-lg px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isActive ? 'bg-brandSoft text-accentStrong' : 'text-grey05 hover:bg-warmCanvas'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
