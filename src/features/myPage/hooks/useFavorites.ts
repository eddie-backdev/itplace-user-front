import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchFavoriteDetail, fetchFavorites, deleteFavorites } from '../apis/favorites';
import { FavoriteDetail, FavoriteItem } from '../../../types/favorites';
import { showToast } from '../../../utils/toast';
import { useResponsive } from '../../../hooks/useResponsive';
import { isGradeApplicableToProfile } from '../../../utils/membership';
import { FavoriteBenefitFilter } from '../../../components/BenefitFilterToggle';
import { isFavoriteTierApplicableToProfile } from '../utils/favoriteMembership.mjs';

const isFavoriteApplicableToProfile = (
  detail: FavoriteDetail,
  userCarrier?: string | null,
  userGrade?: string | null
) =>
  detail.tiers.some((tier) =>
    isFavoriteTierApplicableToProfile(tier, userCarrier, userGrade, isGradeApplicableToProfile)
  );

export function useFavorites(
  itemsPerPageInit = 6,
  userCarrier?: string | null,
  userGrade?: string | null
) {
  const [allFavorites, setAllFavorites] = useState<FavoriteItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [benefitFilter, setBenefitFilter] = useState<FavoriteBenefitFilter>('all');
  const [keyword, setKeyword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [membershipFilterError, setMembershipFilterError] = useState(false);
  const requestVersionRef = useRef(0);
  const { isMobile, isWide, isUltrawide } = useResponsive();

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = isUltrawide ? 10 : isWide ? 8 : itemsPerPageInit;

  // Start in a loading state so the empty state never flashes before the first request.
  const [loading, setLoading] = useState(true);

  const hasMembershipProfile = Boolean(userCarrier && userGrade);

  // ✅ 한 번에 전체 데이터를 불러오기
  const loadFavorites = useCallback(async () => {
    const requestVersion = ++requestVersionRef.current;
    const isCurrentRequest = () => requestVersionRef.current === requestVersion;
    setLoading(true);
    try {
      setLoadError(false);
      setMembershipFilterError(false);
      const favorites: FavoriteItem[] = [];
      let page = 0;
      let hasNext = true;
      while (hasNext && isCurrentRequest()) {
        const response = await fetchFavorites(undefined, page, 100);
        favorites.push(...response.data.content);
        hasNext = response.data.hasNext;
        page += 1;
      }
      if (!isCurrentRequest()) return;

      if (benefitFilter === 'myMembership') {
        if (!hasMembershipProfile) {
          setAllFavorites([]);
        } else {
          const details: Array<{
            favorite: FavoriteItem;
            detail: FavoriteDetail | null;
            failed: boolean;
          }> = [];
          const detailBatchSize = 10;
          for (let start = 0; start < favorites.length; start += detailBatchSize) {
            if (!isCurrentRequest()) return;
            const batch = await Promise.all(
              favorites.slice(start, start + detailBatchSize).map(async (favorite) => {
                try {
                  const detail = await fetchFavoriteDetail(favorite.benefitId);
                  return { favorite, detail: detail.data, failed: false };
                } catch {
                  return { favorite, detail: null, failed: true };
                }
              })
            );
            details.push(...batch);
          }
          if (!isCurrentRequest()) return;

          const failedDetails = details.filter(({ failed }) => failed);
          setMembershipFilterError(failedDetails.length > 0);
          setAllFavorites(
            details
            .filter(
              ({ detail, failed }) =>
                failed ||
                (detail && isFavoriteApplicableToProfile(detail, userCarrier, userGrade))
            )
              .map(({ favorite }) => favorite)
          );
        }
      } else {
        setAllFavorites(favorites);
      }
    } catch (err) {
      if (isCurrentRequest()) {
        console.error('즐겨찾기 목록 불러오기 실패', err);
        setLoadError(true);
        setAllFavorites([]);
      }
    } finally {
      if (isCurrentRequest()) setLoading(false);
    }
  }, [benefitFilter, hasMembershipProfile, userCarrier, userGrade]);

  useEffect(() => {
    void loadFavorites();
    return () => {
      requestVersionRef.current += 1;
    };
  }, [loadFavorites]);

  // ✅ 검색 필터링 (프론트에서)
  const searchedFavorites = useMemo(() => {
    if (!keyword.trim()) return allFavorites;
    const lower = keyword.trim().toLowerCase();
    return allFavorites.filter(
      (fav) =>
        fav.benefitName.toLowerCase().includes(lower) ||
        fav.partnerName.toLowerCase().includes(lower)
    );
  }, [allFavorites, keyword]);

  const totalElements = searchedFavorites.length;

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // ✅ currentItems: 검색 필터링 후 페이지네이션 적용
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return searchedFavorites.slice(startIndex, startIndex + itemsPerPage);
  }, [searchedFavorites, currentPage, itemsPerPage]);

  // ✅ 페이지 변경 시 현재 페이지의 첫 번째 아이템 선택
  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    // 모바일이 아닐 때만 첫 번째 아이템을 자동 선택
    if (!isMobile) {
      const startIndex = (page - 1) * itemsPerPage;
      const newFirst = searchedFavorites[startIndex];
      setSelectedId(newFirst ? newFirst.benefitId : null);
    } else {
      // 📌 모바일이라면 아무것도 선택하지 않음
      setSelectedId(null);
    }
  };

  // ✅ 필터나 검색 변경 시 1페이지로 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [benefitFilter, keyword]);

  // ✅ 목록이 갱신될 때 첫 번째 아이템 선택
  useEffect(() => {
    if (searchedFavorites.length > 0) {
      // 모바일이 아니라면 첫 번째 아이템 선택
      if (!isMobile) {
        setSelectedId(searchedFavorites[0].benefitId);
      } else {
        setSelectedId(null);
      }
    } else {
      setSelectedId(null);
    }
  }, [searchedFavorites, isMobile, itemsPerPage]);

  // ✅ 단일 삭제
  const handleRemoveFavorite = async (benefitId: number) => {
    try {
      await deleteFavorites([benefitId]);
      showToast('삭제에 성공했습니다.', 'success');
      await loadFavorites();
    } catch (e) {
      console.error('단일 즐겨찾기 삭제 실패', e);
      showToast('삭제에 실패했습니다.', 'error');
    }
  };

  // ✅ 다중 삭제
  const handleDeleteSelected = async () => {
    try {
      await deleteFavorites(selectedItems);
      showToast('삭제에 성공했습니다.', 'success');
      setSelectedItems([]);
      setIsEditing(false);
      await loadFavorites();
    } catch (e) {
      console.error('다중 즐겨찾기 삭제 실패', e);
      showToast('삭제에 실패했습니다.', 'error');
    }
  };

  return {
    loading,
    loadError,
    allFavorites,
    currentItems,
    totalElements,
    membershipFilterError,
    currentPage,
    itemsPerPage,
    selectedId,
    benefitFilter,
    setBenefitFilter,
    keyword,
    setKeyword,
    isEditing,
    setIsEditing,
    selectedItems,
    setSelectedItems,
    pendingDeleteId,
    setPendingDeleteId,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    handlePageChange,
    handleRemoveFavorite,
    handleDeleteSelected,
    setSelectedId,
    reloadFavorites: loadFavorites,
    hasMembershipProfile,
  };
}
