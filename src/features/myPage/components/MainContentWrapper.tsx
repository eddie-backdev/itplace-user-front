import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface MainContentWrapperProps {
  children: ReactNode;
}

export default function MainContentWrapper({ children }: MainContentWrapperProps) {
  const { pathname } = useLocation();

  const isSimpleLayout =
    pathname.startsWith('/mypage/favorites') || pathname.startsWith('/mypage/history');

  const className =
    'flex flex-1 flex-col max-w-[780px] min-h-[620px] max-xlg:min-h-0 bg-white/95 rounded-[24px] border border-white/80 shadow-[0_14px_36px_rgba(37,9,97,0.09)] pt-[32px] pb-[26px] px-[34px] max-xl:pt-[30px] max-xl:pb-[24px] max-xl:px-[30px] max-xlg:pt-[26px] max-xlg:pb-[24px] max-xlg:px-[24px] ' +
    (isSimpleLayout
      ? // 모바일 favorites / history 전용: 그림자, radius 제거 + 패딩 제거
        'max-md:rounded-none max-md:border-none max-md:shadow-none max-md:bg-white max-md:px-0 max-md:pb-6'
      : // 모바일 myInfo 전용: radius, 그림자 유지 + 모바일 패딩
        'max-md:rounded-[22px] max-md:p-5 max-md:shadow-[0_10px_30px_rgba(37,9,97,0.08)]');

  return <main className={className}>{children}</main>;
}
