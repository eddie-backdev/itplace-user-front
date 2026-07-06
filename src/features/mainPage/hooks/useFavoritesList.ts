import { useEffect, useCallback, useRef, useState } from 'react';
import { FavoriteBenefit, FavoritesListRequest } from '../types/api';
import { getFavoritesList } from '../api/favoritesListApi';
import { useApiCall } from './useApiCall';
import { addFavoritesChangedListener } from '../utils/favoriteEvents';

/**
 * 즐겨찾기 목록 관리 훅
 * 카테고리별 즐겨찾기 조회 및 새로고침 기능 제공
 */
export const useFavoritesList = (category?: string) => {
  const { data: favorites, isLoading, error, execute } = useApiCall<FavoriteBenefit[]>([]);

  // 함수 참조를 ref로 저장 (의존성 배열 최적화)
  const executeRef = useRef(execute);
  executeRef.current = execute;

  /**
   * 즐겨찾기 목록 조회
   * 카테고리가 '전체'이거나 비어있으면 전체 조회, 그 외에는 카테고리별 조회
   */
  const fetchFavorites = useCallback(async (selectedCategory?: string) => {
    const params: FavoritesListRequest = {};

    // 카테고리 필터링 설정
    if (selectedCategory && selectedCategory !== '전체') {
      params.category = selectedCategory;
    }

    const data = await getFavoritesList(params);
    return data;
  }, []);

  // fetchFavorites 참조를 ref로 저장 (의존성 배열 최적화)
  const fetchFavoritesRef = useRef(fetchFavorites);
  fetchFavoritesRef.current = fetchFavorites;

  // category 참조를 ref로 저장 (의존성 배열 최적화)
  const categoryRef = useRef(category);
  categoryRef.current = category;

  // 초기 로드 상태 관리 (nearby 방식과 완전히 동일)
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isInitialLoadRef = useRef(isInitialLoad);
  isInitialLoadRef.current = isInitialLoad;

  // 초기 로드만 (nearby 패턴과 동일)
  useEffect(() => {
    const initializeFavorites = async () => {
      if (categoryRef.current !== undefined) {
        const data = await fetchFavoritesRef.current(categoryRef.current);
        return data;
      }
      return [];
    };

    executeRef.current(initializeFavorites);
  }, []); // 빈 의존성 배열로 초기 로드만

  // 초기 로드 완료 감지 (nearby 패턴과 동일 - favorites 데이터가 로드된 후에 완료 처리)
  useEffect(() => {
    if (favorites && favorites.length >= 0 && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [favorites, isInitialLoad]);

  // 카테고리 변경 시에만 실행 (초기 로드 제외)
  const previousCategoryRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    // 이전 값과 동일하면 스킵 (중복 호출 방지)
    if (previousCategoryRef.current === category) {
      return;
    }

    if (isInitialLoadRef.current || categoryRef.current === undefined) {
      previousCategoryRef.current = category;
      return;
    }

    previousCategoryRef.current = category;

    const reloadByCategory = async () => {
      const data = await fetchFavoritesRef.current(categoryRef.current!);
      return data;
    };

    executeRef.current(reloadByCategory);
  }, [category]);

  /**
   * 즐겨찾기 목록 새로고침
   */
  const refreshFavorites = useCallback(() => {
    if (category !== undefined) {
      executeRef.current(() => fetchFavoritesRef.current(category));
    }
  }, [category]);

  useEffect(() => {
    return addFavoritesChangedListener(() => {
      if (categoryRef.current !== undefined) {
        executeRef.current(() => fetchFavoritesRef.current(categoryRef.current));
      }
    });
  }, []);

  return {
    favorites: favorites || [], // null 방어
    isLoading,
    error,
    refreshFavorites,
  };
};
