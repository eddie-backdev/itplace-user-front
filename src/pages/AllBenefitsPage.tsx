import PageSeo from '../components/PageSeo';
import SiteFooter from '../components/SiteFooter';
import AllBenefitsLayout from '../features/allBenefitsPage';

const AllBenefitsPage = () => {
  return (
    <div className="md:flex md:h-screen md:flex-col md:overflow-hidden">
      <PageSeo
        title="전체 통신사 멤버십 혜택 | 잇플레이스"
        description="SKT, KT, LG U+ 통신사 멤버십 제휴 혜택을 브랜드, 카테고리, 통신사별로 검색하고 비교하세요."
        path="/benefits"
      />
      <AllBenefitsLayout />
      <div className="max-md:hidden md:shrink-0">
        <SiteFooter />
      </div>
    </div>
  );
};

export default AllBenefitsPage;
