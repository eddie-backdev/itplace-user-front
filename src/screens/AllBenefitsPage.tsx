import SiteFooter from '../components/SiteFooter';
import AllBenefitsLayout from '../features/allBenefitsPage';
import type { PartnerBenefitResponse } from '../features/allBenefitsPage/apis/allBenefitsApi';

const AllBenefitsPage = ({ initialData }: { initialData?: PartnerBenefitResponse | null }) => {
  return (
    <div className="md:flex md:h-screen md:flex-col md:overflow-hidden">
      <AllBenefitsLayout initialData={initialData} />
      <div className="max-md:hidden md:shrink-0">
        <SiteFooter />
      </div>
    </div>
  );
};

export default AllBenefitsPage;
