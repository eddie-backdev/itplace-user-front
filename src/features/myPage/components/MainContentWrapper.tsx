import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface MainContentWrapperProps {
  children: ReactNode;
}

export default function MainContentWrapper({ children }: MainContentWrapperProps) {
  const { pathname } = useLocation();

  const isSimpleLayout = pathname.startsWith('/mypage/favorites');

  const className =
    'flex min-h-0 flex-1 flex-col max-w-[720px] bg-white/95 rounded-[20px] border border-white/80 shadow-[0_10px_28px_rgba(16,17,20,0.07)] px-6 py-5 max-xl:px-5 max-xl:py-5 max-xlg:px-5 max-xlg:py-5 ' +
    (isSimpleLayout
      ? // 모바일 favorites 전용: 그림자, radius 제거 + 패딩 제거
        'max-md:rounded-none max-md:border-none max-md:shadow-none max-md:bg-white max-md:px-0 max-md:pb-6'
      : // 모바일 myInfo 전용: radius, 그림자 유지 + 모바일 패딩
        'max-md:rounded-[18px] max-md:p-4 max-md:shadow-[0_8px_22px_rgba(16,17,20,0.07)]');

  return <main className={className}>{children}</main>;
}
