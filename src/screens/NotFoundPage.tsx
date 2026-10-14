import { Link } from '@/lib/navigation';
import { TbGift, TbHome, TbMapPin } from 'react-icons/tb';
import MobileHeader from '@/components/MobileHeader';
import SiteFooter from '@/components/SiteFooter';

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <div className="h-[54px] md:hidden">
        <MobileHeader title="잇플레이스" />
      </div>
      <section className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col justify-center px-5 py-12 sm:px-8 lg:px-10">
        <div className="max-w-[620px]">
          <p className="text-sm font-semibold text-brandStrong">404 · 페이지 없음</p>
          <h1 className="mt-3 text-balance text-3xl font-bold leading-tight tracking-[-0.035em] sm:text-4xl">
            페이지를 찾을 수 없어요
          </h1>
          <p className="mt-3 max-w-[60ch] text-sm leading-7 text-grey06 sm:text-base">
            입력한 주소에 해당하는 페이지가 없습니다. 혜택을 검색하거나 주변 매장을 찾아보세요.
          </p>

          <nav aria-label="다른 페이지로 이동" className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/benefits"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brandStrong px-5 font-semibold text-white transition-colors hover:bg-brandHover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <TbGift size={18} aria-hidden="true" /> 혜택 검색하기
            </Link>
            <Link
              to="/map"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-warmBorder bg-white px-5 font-semibold text-ink transition-colors hover:bg-warmCanvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <TbMapPin size={18} aria-hidden="true" /> 주변 매장 찾기
            </Link>
            <Link
              to="/"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 font-semibold text-brandStrong transition-colors hover:bg-brandSoft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <TbHome size={18} aria-hidden="true" /> 홈으로
            </Link>
          </nav>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
};

export default NotFoundPage;
