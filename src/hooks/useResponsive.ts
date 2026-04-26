import { useMediaQuery } from 'react-responsive';

export const BREAKPOINTS = {
  mobileMax: 767,
  tabletMax: 1023,
  laptopMax: 1535,
} as const;

export const useResponsive = () => {
  const isMobile = useMediaQuery({ query: `(max-width: ${BREAKPOINTS.mobileMax}px)` });
  const isTablet = useMediaQuery({
    query: `(min-width: ${BREAKPOINTS.mobileMax + 1}px) and (max-width: ${BREAKPOINTS.tabletMax}px)`,
  });
  const isLaptop = useMediaQuery({
    query: `(min-width: ${BREAKPOINTS.tabletMax + 1}px) and (max-width: ${BREAKPOINTS.laptopMax}px)`,
  });
  const isDesktop = useMediaQuery({ query: `(min-width: ${BREAKPOINTS.laptopMax + 1}px)` });

  return { isMobile, isTablet, isLaptop, isDesktop };
};
