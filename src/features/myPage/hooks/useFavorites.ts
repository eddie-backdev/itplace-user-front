import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchFavoriteDetail, fetchFavorites, deleteFavorites } from '../apis/favorites';
import { FavoriteDetail, FavoriteItem } from '../../../types/favorites';
import { showToast } from '../../../utils/toast';
import { useResponsive } from '../../../hooks/useResponsive';
import { isGradeApplicableToProfile } from '../../../utils/membership';
import { FavoriteBenefitFilter } from '../../../components/BenefitFilterToggle';

const isFavoriteApplicableToProfile = (
  detail: FavoriteDetail,
  userCarrier?: string | null,
  userGrade?: string | null
) => {
  if (!userCarrier || !userGrade) return false;

  return detail.tiers.some(
    (tier) =>
      tier.isAll ||
      isGradeApplicableToProfile({
        benefitCarrier: tier.carrier,
        benefitGrade: tier.grade,
        userCarrier,
        userGrade,
      })
  );
};

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
  const { isMobile } = useResponsive();

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(itemsPerPageInit);

  // 로딩 상태
  const [loading, setLoading] = useState(false);

  const hasMembershipProfile = Boolean(userCarrier && userGrade);

  // ✅ 전체 데이터 기반으로 totalElements 관리
  const totalElements = allFavorites.length;

  // ✅ 한 번에 전체 데이터를 불러오기
  const loadFavorites = useCallback(async () => {
    setLoading(true);
    try {
      setLoadError(false);
      const res = await fetchFavorites(undefined, 0, 9999);
      let favorites = res.data.content;

      if (benefitFilter === 'myMembership') {
        if (!hasMembershipProfile) {
          favorites = [];
        } else {
          const details = await Promise.all(
            favorites.map(async (favorite) => {
              try {
                const detail = await fetchFavoriteDetail(favorite.benefitId);
                return { favorite, detail: detail.data };
              } catch (error) {
                console.error('관심 혜택 상세 필터링 실패', error);
                return { favorite, detail: null };
              }
            })
          );

          favorites = details
            .filter(
              ({ detail }) =>
                detail && isFavoriteApplicableToProfile(detail, userCarrier, userGrade)
            )
            .map(({ favorite }) => favorite);
        }
      }

      setAllFavorites(favorites);
    } catch (err) {
      console.error('즐겨찾기 목록 불러오기 실패', err);
      setLoadError(true);
      setAllFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [benefitFilter, hasMembershipProfile, userCarrier, userGrade]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // ✅ 검색 필터링 (프론트에서)
  const searchedFavorites = useMemo(() => {
    if (!keyword.trim()) return allFavorites;
    const lower = keyword.trim().toLowerCase();
    return allFavorites.filter((fav) => fav.benefitName.toLowerCase().includes(lower));
  }, [allFavorites, keyword]);

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
  }, [searchedFavorites, isMobile]);

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
