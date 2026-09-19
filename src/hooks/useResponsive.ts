import { useSyncExternalStore } from 'react';

export const BREAKPOINTS = {
  mobileMax: 767,
  tabletMax: 1023,
  laptopMax: 1535,
} as const;

const createMediaQueryStore = (query: string) => ({
  subscribe: (onStoreChange: () => void) => {
    if (typeof window === 'undefined' || !window.matchMedia) return () => undefined;
    const mediaQuery = window.matchMedia(query);
    mediaQuery.addEventListener('change', onStoreChange);
    return () => mediaQuery.removeEventListener('change', onStoreChange);
  },
  getSnapshot: () =>
    typeof window !== 'undefined' && Boolean(window.matchMedia?.(query).matches),
  getServerSnapshot: () => false,
});

const mobileStore = createMediaQueryStore(`(max-width: ${BREAKPOINTS.mobileMax}px)`);
const tabletStore = createMediaQueryStore(
  `(min-width: ${BREAKPOINTS.mobileMax + 1}px) and (max-width: ${BREAKPOINTS.tabletMax}px)`
);
const laptopStore = createMediaQueryStore(
  `(min-width: ${BREAKPOINTS.tabletMax + 1}px) and (max-width: ${BREAKPOINTS.laptopMax}px)`
);
const desktopStore = createMediaQueryStore(`(min-width: ${BREAKPOINTS.laptopMax + 1}px)`);

const useMediaQueryStore = (store: ReturnType<typeof createMediaQueryStore>) =>
  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

export const useResponsive = () => {
  const isMobile = useMediaQueryStore(mobileStore);
  const isTablet = useMediaQueryStore(tabletStore);
  const isLaptop = useMediaQueryStore(laptopStore);
  const isDesktop = useMediaQueryStore(desktopStore);

  return { isMobile, isTablet, isLaptop, isDesktop };
};
