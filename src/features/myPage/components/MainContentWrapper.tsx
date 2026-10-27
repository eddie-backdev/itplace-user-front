import { ReactNode } from 'react';
import { useLocation } from '@/lib/navigation';

interface MainContentWrapperProps {
  children: ReactNode;
}

export default function MainContentWrapper({ children }: MainContentWrapperProps) {
  const { pathname } = useLocation();

  const isSimpleLayout = pathname.startsWith('/mypage/favorites');

  const className =
    'flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl border border-warmBorder bg-warmSurface px-5 py-5 lg:px-6 lg:py-6 2xl:px-8 2xl:py-8 ' +
    (isSimpleLayout
      ? 'max-md:rounded-none max-md:border-none max-md:bg-transparent max-md:px-0 max-md:pb-6 max-md:pt-0'
      : 'max-md:rounded-none max-md:border-none max-md:bg-transparent max-md:p-4');

  return <div className={className}>{children}</div>;
}
