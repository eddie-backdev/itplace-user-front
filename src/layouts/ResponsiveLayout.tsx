import MobileLayout from './MobileLayout';
import DefaultLayout from './DefaultLayout';
import ScrollToTop from '../components/ScrollToTop';
import { useResponsive } from '../hooks/useResponsive';

const ResponsiveLayout = () => {
  const { isMobile } = useResponsive();
  return (
    <>
      <ScrollToTop />
      {isMobile ? <MobileLayout /> : <DefaultLayout />}
    </>
  );
};

export default ResponsiveLayout;
