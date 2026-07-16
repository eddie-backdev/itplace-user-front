import MainPage from './MainPage';
import MobileHomePage from './MobileHomePage';
import { useResponsive } from '../hooks/useResponsive';
import PageSeo from '../components/PageSeo';

const HomeRoute = () => {
  const { isMobile } = useResponsive();
  return (
    <>
      <PageSeo
        title="잇플레이스 | 통신 3사 멤버십 혜택 검색"
        description="잇플레이스(ITPLACE, 잇플)에서 SKT, KT, LG U+ 통신 3사 멤버십 제휴처와 혜택을 지도와 목록으로 검색하고 비교하세요."
        path="/"
      />
      {isMobile ? <MobileHomePage /> : <MainPage />}
    </>
  );
};

export default HomeRoute;
