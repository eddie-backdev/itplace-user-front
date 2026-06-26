import { useLocation } from 'react-router-dom';
import PageSeo from '../components/PageSeo';
import MainPageLayout from '../features/mainPage/components/Layout';

const MainPage = () => {
  const location = useLocation();
  const isMapRoute = location.pathname === '/map';

  return (
    <>
      <PageSeo
        title={
          isMapRoute
            ? '통신사 멤버십 혜택 지도 | ITPLACE'
            : 'ITPLACE | 통신사 멤버십 혜택 지도 검색'
        }
        description="SKT, KT, LG U+ 멤버십 제휴처와 주변 혜택을 지도에서 검색하고 온라인·오프라인 이용 조건을 확인하세요."
        path={isMapRoute ? '/map' : '/'}
      />
      <MainPageLayout />
    </>
  );
};

export default MainPage;
