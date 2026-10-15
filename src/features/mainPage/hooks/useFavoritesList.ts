import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { FavoriteBenefit, FavoritesListRequest } from '../types/api';
import { getFavoritesList } from '../api/favoritesListApi';
import { useApiCall } from './useApiCall';
import { addFavoritesChangedListener } from '../utils/favoriteEvents';

/**
 * 즐겨찾기 목록 관리 훅
 * 카테고리별 즐겨찾기 조회 및 새로고침 기능 제공
 */
export const useFavoritesList = (category?: string) => {
  const isAuthReady = useSelector((state: RootState) => state._persist.rehydrated);
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const isAuthenticated = isAuthReady && isLoggedIn;
  const { data: favorites, isLoading, error, execute } = useApiCall<FavoriteBenefit[]>([]);

  const fetchFavorites = useCallback(async (selectedCategory: string) => {
    const params: FavoritesListRequest = {};
    if (selectedCategory && selectedCategory !== '전체') {
      params.category = selectedCategory;
    }
    return getFavoritesList(params);
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn) {
      void execute(async () => []);
      return;
    }
    if (category === undefined) return;

    void execute(() => fetchFavorites(category));
  }, [category, execute, fetchFavorites, isAuthReady, isLoggedIn]);

  const refreshFavorites = useCallback(() => {
    if (isAuthenticated && category !== undefined) {
      void execute(() => fetchFavorites(category));
    }
  }, [category, execute, fetchFavorites, isAuthenticated]);

  useEffect(
    () =>
      addFavoritesChangedListener(() => {
        if (isAuthenticated && category !== undefined) {
          void execute(() => fetchFavorites(category));
        }
      }),
    [category, execute, fetchFavorites, isAuthenticated]
  );

  return {
    favorites: isAuthenticated ? favorites || [] : [],
    isLoading: isAuthenticated ? isLoading : false,
    error: isAuthenticated ? error : null,
    refreshFavorites,
  };
};
