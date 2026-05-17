import MainPage from './MainPage';
import MobileHomePage from './MobileHomePage';
import { useResponsive } from '../hooks/useResponsive';

const HomeRoute = () => {
  const { isMobile } = useResponsive();
  return isMobile ? <MobileHomePage /> : <MainPage />;
};

export default HomeRoute;
