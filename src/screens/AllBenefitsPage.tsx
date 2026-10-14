import SiteFooter from '../components/SiteFooter';
import AllBenefitsLayout from '../features/allBenefitsPage';
import type { PartnerBenefitResponse } from '../features/allBenefitsPage/apis/allBenefitsApi';
import styles from '../features/allBenefitsPage/BenefitsExplorer.module.css';

const AllBenefitsPage = ({
  initialData,
  initialRequestKey,
}: {
  initialData?: PartnerBenefitResponse | null;
  initialRequestKey?: string;
}) => {
  return (
    <div className={styles.benefitsShell}>
      <div className={styles.benefitsWorkspace}>
        <AllBenefitsLayout initialData={initialData} initialRequestKey={initialRequestKey} />
      </div>
      <div className={styles.benefitsFooter}>
        <SiteFooter />
      </div>
    </div>
  );
};

export default AllBenefitsPage;
