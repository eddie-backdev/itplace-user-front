import { ReactNode } from 'react';
import { useLocation } from '@/lib/navigation';

interface RightAsideProps {
  children: ReactNode;
}

export default function RightAside({ children }: RightAsideProps) {
  const { pathname } = useLocation();

  // ✅ 모바일 레이아웃을 위한 조건분기
  const isSimpleLayout = pathname.startsWith('/mypage/favorites');

  return (
    <aside
      className={
        'flex min-h-0 w-full flex-col rounded-2xl border border-warmBorder bg-white px-5 py-5 lg:w-[380px] lg:min-w-[360px] lg:flex-none 2xl:w-[400px] 2xl:min-w-[400px] max-md:rounded-[18px] max-md:p-4 ' +
        (isSimpleLayout ? ' max-md:hidden' : '')
      }
    >
      {/* 위쪽 내용 */}
      <div className="min-h-0 flex-1">{children}</div>
    </aside>
  );
}
