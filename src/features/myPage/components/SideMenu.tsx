import { NavLink } from '@/lib/navigation';

const menuItems = [
  { to: '/mypage/info', label: '회원 정보' },
  { to: '/mypage/favorites', label: '관심 혜택' },
  { to: '/mypage/activity', label: '사용 기록' },
];

export default function SideMenu() {
  return (
    <nav
      aria-label="마이페이지 탭"
      className="fixed left-0 top-[53px] z-50 hidden w-full border-b border-[#E8EAED] bg-white px-3 py-1.5 max-md:block"
    >
      <div className="mx-auto grid max-w-[520px] grid-cols-3 gap-1">
        {menuItems.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={({ isActive }) =>
              `flex min-h-11 min-w-0 items-center justify-center rounded-lg px-1 text-center text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                isActive ? 'bg-[#EDF8F2] text-brandStrong' : 'text-[#686D76] hover:bg-[#F8F9FA]'
              }`
            }
          >
            <span className="break-keep">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
