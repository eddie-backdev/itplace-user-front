import { lazy, useEffect, useState } from 'react';
import { Link } from '@/lib/navigation';
import { useResponsive } from '../hooks/useResponsive';
import type { PartnerBenefitItem } from '../features/allBenefitsPage/apis/allBenefitsApi';
import { getPartnerBenefitPath } from '../utils/partnerSeo';

const MainPage = lazy(() => import('./MainPage'));
const MobileHomePage = lazy(() => import('./MobileHomePage'));

const HomeRoute = ({
  initialPartners = null,
}: {
  initialPartners?: PartnerBenefitItem[] | null;
}) => {
  const { isMobile } = useResponsive();
  const [isViewportReady, setIsViewportReady] = useState(false);

  useEffect(() => {
    setIsViewportReady(true);
  }, []);

  if (!isViewportReady) {
    return (
      <section className="min-h-screen bg-warmCanvas" aria-busy="true">
        <div className="sr-only">
          <h1>통신 3사 멤버십 혜택을 한곳에서 찾아보세요</h1>
          <p>주변 제휴처는 지도에서 찾고, SKT·KT·LG U+ 혜택은 목록에서 바로 비교할 수 있습니다.</p>
          <nav aria-label="혜택 탐색">
            <Link to="/map">지도에서 찾기</Link>
            <Link to="/benefits">전체 혜택 보기</Link>
          </nav>
          {initialPartners && initialPartners.length > 0 ? (
            <nav aria-label="인기 제휴처">
              {initialPartners.slice(0, 4).map((partner) => (
                <Link
                  key={partner.partnerId}
                  to={getPartnerBenefitPath(partner.partnerId, partner.partnerName)}
                >
                  {partner.partnerName}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>

        <div
          className="hidden h-screen grid-cols-[370px_minmax(0,1fr)] bg-white md:grid"
          aria-hidden="true"
        >
          <div className="space-y-4 border-r border-warmBorder p-6">
            <div className="h-12 animate-pulse rounded-2xl bg-grey01" />
            <div className="h-10 animate-pulse rounded-xl bg-grey01" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="h-10 animate-pulse rounded-xl bg-grey01" />
              ))}
            </div>
            <div className="h-56 animate-pulse rounded-2xl bg-grey01" />
          </div>
          <div className="animate-pulse bg-[#eef0e8]" />
        </div>

        <div className="space-y-6 px-5 pb-24 pt-5 md:hidden" aria-hidden="true">
          <div className="h-56 animate-pulse rounded-[28px] bg-white shadow-soft" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-9 w-16 animate-pulse rounded-full bg-white" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-[86px] animate-pulse rounded-[22px] bg-white" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return isMobile ? (
    <MobileHomePage initialPartners={initialPartners} />
  ) : (
    <>
      <h1 className="sr-only">통신 3사 멤버십 혜택 비교·검색</h1>
      <MainPage />
    </>
  );
};

export default HomeRoute;
