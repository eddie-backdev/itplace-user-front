import { useLocation } from 'react-router-dom';
import PageSeo from '../components/PageSeo';
import MainPageLayout from '../features/mainPage/components/Layout';

const MainPage = () => {
  const location = useLocation();
  const isMapRoute = location.pathname === '/map';

  return (
    <>
      <script
        async
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_JDK_API_KEY}&autoload=false`}
      />
      <h1 className="sr-only">
        {isMapRoute ? '통신사 멤버십 혜택 지도' : '통신 3사 멤버십 혜택 비교·검색'}
      </h1>
      {isMapRoute ? (
        <PageSeo
          title="통신사 멤버십 혜택 지도 | 잇플레이스"
          description="SKT, KT, LG U+ 멤버십 제휴처와 주변 혜택을 지도에서 검색하고 온라인·오프라인 이용 조건을 확인하세요."
          path="/map"
        />
      ) : null}
      <MainPageLayout />
    </>
  );
};

export default MainPage;
