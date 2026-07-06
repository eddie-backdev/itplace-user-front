export const FAVORITES_CHANGED_EVENT = 'itplace:favorites-changed';

export interface FavoritesChangedDetail {
  benefitIds: number[];
  isFavorite: boolean;
}

export const emitFavoritesChanged = (detail: FavoritesChangedDetail) => {
  window.dispatchEvent(
    new CustomEvent<FavoritesChangedDetail>(FAVORITES_CHANGED_EVENT, { detail })
  );
};

export const addFavoritesChangedListener = (listener: (detail: FavoritesChangedDetail) => void) => {
  const eventListener = (event: Event) => {
    listener((event as CustomEvent<FavoritesChangedDetail>).detail);
  };

  window.addEventListener(FAVORITES_CHANGED_EVENT, eventListener);
  return () => window.removeEventListener(FAVORITES_CHANGED_EVENT, eventListener);
};
