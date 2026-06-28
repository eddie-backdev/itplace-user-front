import PageSeo from '../components/PageSeo';
import SiteFooter from '../components/SiteFooter';
import AllBenefitsLayout from '../features/allBenefitsPage';

const AllBenefitsPage = () => {
  return (
    <>
      <PageSeo
        title="전체 멤버십 혜택 | ITPLACE"
        description="SKT, KT, LG U+ 통신사 멤버십 제휴 혜택을 브랜드, 카테고리, 통신사별로 검색하고 비교하세요."
        path="/benefits"
      />
      <AllBenefitsLayout />
      <SiteFooter />
    </>
  );
};

export default AllBenefitsPage;
