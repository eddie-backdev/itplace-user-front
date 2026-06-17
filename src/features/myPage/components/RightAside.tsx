import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

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
        'w-full min-h-0 max-w-[310px] min-w-[270px] bg-white/95 rounded-[20px] border border-white/80 shadow-[0_10px_28px_rgba(16,17,20,0.07)] px-5 py-5 flex flex-col max-xl:max-w-[290px] max-xl:min-w-[250px] max-xlg:max-w-none max-xlg:w-full max-xlg:min-w-[220px] max-xlg:px-5 max-xlg:py-5 max-md:w-full max-md:rounded-[18px] max-md:p-4 ' +
        (isSimpleLayout ? ' max-md:hidden' : '')
      }
    >
      {/* 위쪽 내용 */}
      <div className="min-h-0 flex-1">{children}</div>
    </aside>
  );
}
