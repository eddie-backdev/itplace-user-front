import { useFavorites } from '../../features/myPage/hooks/useFavorites';
import { LoadingSpinner, Pagination } from '../../components';
import BenefitFilterToggle from '../../components/BenefitFilterToggle';
import SearchBar from '../../components/SearchBar';
import NoResult from '../../components/NoResult';
import BenefitCardList from '../../features/myPage/components/Favorites/BenefitCardList';
import EditControls from '../../features/myPage/components/Favorites/EditControls';
import MyPageContentLayout from '../../features/myPage/layout/MyPageContentLayout';
import FavoritesDeleteModal from '../../features/myPage/components/Favorites/FavoritesDeleteModal';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import BenefitDetailTabs from '../../features/myPage/components/Favorites/BenefitDetailTabs';
import { useResponsive } from '../../hooks/useResponsive';
import DetailModal from '../../components/DetailModal';
import { Link } from '@/lib/navigation';
import { useState } from 'react';

export default function MyFavoritesPage() {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const userCarrier = user?.carrier;
  const userGrade = user?.membershipGradeCode ?? user?.membershipGrade;
  const { isMobile } = useResponsive();

  const {
    loading,
    loadError,
    membershipFilterError,
    allFavorites,
    totalElements,
    currentItems,
    selectedId,
    setSelectedId,
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
    handleRemoveFavorite,
    handleDeleteSelected,
    handlePageChange,
    itemsPerPage,
    currentPage,
    reloadFavorites,
    hasMembershipProfile,
  } = useFavorites(4, userCarrier, userGrade);
  const selectedFavorite =
    selectedId === null
      ? undefined
      : allFavorites.find((favorite) => favorite.benefitId === selectedId);

  return (
    <div className="flex w-full min-w-0 flex-1 items-stretch gap-4 max-lg:flex-col max-md:px-4 max-md:pb-8 max-md:pt-4">
      <MyPageContentLayout
        main={
          <div className={`flex min-w-0 flex-1 flex-col ${isMobile && isEditing ? 'pb-20' : ''}`}>
            <header className="mb-5">
              <h1 className="text-title-4 font-bold tracking-tight text-ink max-md:text-title-5">
                관심 혜택
              </h1>
              <p className="mt-1.5 text-sm leading-6 text-warmMuted">
                관심 혜택을 다시 찾고, 사용 기록까지 이어가세요.
              </p>
            </header>
            <div className="mb-5 rounded-xl border border-warmBorder bg-warmCanvas p-3 sm:p-4">
              <SearchBar
                placeholder="브랜드 또는 혜택 검색"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onClear={() => setKeyword('')}
                backgroundColor="bg-warmSurface"
                className="h-12 w-full"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <BenefitFilterToggle
                  value={benefitFilter}
                  onChange={setBenefitFilter}
                  width="w-full sm:w-[240px]"
                  heightClass="min-h-11"
                  className="!mb-0 bg-warmSurface"
                  fontSize="text-sm"
                  disabledMyMembership={!hasMembershipProfile}
                />
                <p className="text-sm text-warmMuted">{totalElements}개의 관심 혜택</p>
              </div>
            </div>
            {benefitFilter === 'myMembership' &&
              membershipFilterError &&
              !loading &&
              !loadError && (
                <div
                  role="status"
                  className="mb-3 rounded-lg border border-accentSoft bg-brandSoft/50 px-3 py-2 text-sm leading-6 text-grey06"
                >
                  일부 혜택의 멤버십 조건을 확인하지 못해 관심 혜택도 함께 표시하고 있어요.
                  <button
                    type="button"
                    onClick={() => void reloadFavorites()}
                    className="ml-2 min-h-11 font-semibold text-accentStrong underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    다시 확인
                  </button>
                </div>
              )}
            {/* 편집/전체선택 컨트롤 */}
            {currentItems.length > 0 && (
              <EditControls
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                currentItems={currentItems}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
              />
            )}
            {/* 모달 */}
            <FavoritesDeleteModal
              isOpen={isDeleteModalOpen}
              onClose={() => {
                setIsDeleteModalOpen(false);
                setPendingDeleteId(null);
              }}
              onConfirm={() => {
                if (pendingDeleteId !== null) {
                  handleRemoveFavorite(pendingDeleteId);
                } else {
                  handleDeleteSelected();
                }
                setIsDeleteModalOpen(false);
                setPendingDeleteId(null);
              }}
            />
            {/* 카드 리스트 */}
            {/* 검색 결과가 없을 때는 "검색 결과 없음" 표시
            검색어가 없고 목록도 없을 때는 "관심 혜택이 없음" 표시 */}
            {loading ? (
              // 로딩 중
              <div className="flex justify-center items-center min-h-[220px]">
                <LoadingSpinner />
              </div>
            ) : loadError ? (
              <div className="mt-8 rounded-2xl border border-warmBorder bg-warmSurface">
                <NoResult
                  variant="error"
                  message1="관심 혜택을 불러오지 못했어요"
                  message2="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
                  buttonText="다시 시도"
                  onButtonClick={reloadFavorites}
                  message1FontSize="max-xl:text-title-6"
                  message2FontSize="max-xl:text-body-3"
                />
              </div>
            ) : keyword.trim() ? (
              currentItems.length === 0 ? (
                <div className="mt-8 rounded-2xl border border-warmBorder bg-warmSurface">
                  <NoResult
                    message1="검색 결과가 없어요."
                    message2="다른 키워드로 검색해보세요."
                    message1FontSize="max-xl:text-title-6"
                    message2FontSize="max-xl:text-body-3"
                  />
                </div>
              ) : (
                <BenefitCardList
                  items={currentItems}
                  userCarrier={userCarrier}
                  userGrade={userGrade}
                  selectedId={selectedId}
                  setSelectedId={setSelectedId}
                  onOpenDetails={() => setIsDetailOpen(true)}
                  isEditing={isEditing}
                  selectedItems={selectedItems}
                  setSelectedItems={setSelectedItems}
                  onRequestDelete={(id: number) => {
                    setPendingDeleteId(id);
                    setIsDeleteModalOpen(true);
                  }}
                />
              )
            ) : allFavorites.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-warmBorder bg-warmSurface">
                <NoResult
                  message1={
                    benefitFilter === 'myMembership'
                      ? '내 멤버십에 맞는 관심 혜택이 없어요'
                      : '관심 혜택이 아직 없어요.'
                  }
                  message2={
                    benefitFilter === 'myMembership'
                      ? hasMembershipProfile
                        ? '전체 혜택으로 전환하거나 다른 혜택을 추가해 보세요.'
                        : '회원 정보에서 통신사와 등급을 먼저 선택해 주세요.'
                      : '마음에 드는 혜택을 추가해 보세요.'
                  }
                  buttonText="전체 혜택 보러가기"
                  buttonRoute="/benefits"
                  message1FontSize="max-xl:text-title-6"
                  message2FontSize="max-xl:text-body-3"
                />
              </div>
            ) : (
              <BenefitCardList
                items={currentItems}
                userCarrier={userCarrier}
                userGrade={userGrade}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                onOpenDetails={() => setIsDetailOpen(true)}
                isEditing={isEditing}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
                onRequestDelete={(id: number) => {
                  setPendingDeleteId(id);
                  setIsDeleteModalOpen(true);
                }}
              />
            )}

            {/* 페이지네이션 */}
            {!(
              (keyword.trim() && currentItems.length === 0) || // 검색 중이고 결과가 0
              (!keyword.trim() && allFavorites.length === 0) // 검색 안 했는데 전체도 0
            ) && (
              <div className="relative mt-6 flex items-end justify-center max-md:mb-4">
                <Pagination
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalElements}
                  onPageChange={handlePageChange}
                />
                {!isMobile && isEditing && (
                  <div className="absolute right-[8px] top-[20px] flex gap-3 max-xl:gap-1 max-xl:top-[18px]">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedItems([]);
                      }}
                      className="inline-flex min-h-11 items-center rounded-lg border border-warmBorder bg-warmSurface px-4 text-sm font-semibold text-grey05 hover:bg-warmCanvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent max-xl:text-body-5"
                    >
                      편집 취소
                    </button>
                    <button
                      onClick={() => {
                        setPendingDeleteId(null);
                        setIsDeleteModalOpen(true);
                      }}
                      className="inline-flex min-h-11 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brandStrong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 max-xl:text-body-5"
                    >
                      삭제하기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        }
        aside={null}
      />

      {/* ✅ 모바일에서만, 편집 모드일 때 하단 고정 버튼 */}
      {isMobile && isEditing && (
        <div
          className="fixed left-0 z-[9999] flex w-full border-grey03 bg-warmSurface p-4"
          style={{ bottom: 'var(--itplace-mobile-tab-bar-offset, 64px)' }}
        >
          <button
            onClick={() => {
              setIsEditing(false);
              setSelectedItems([]);
            }}
            className="min-h-11 rounded-xl border border-warmBorder bg-warmSurface px-5 text-sm font-semibold text-grey05 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            취소
          </button>
          {/* 삭제 버튼: 선택된 항목에 따라 색상 변경 */}
          <button
            onClick={() => {
              // 선택된 항목이 있을 때만 삭제 모달 열기
              if (selectedItems.length > 0) {
                setPendingDeleteId(null);
                setIsDeleteModalOpen(true);
              }
            }}
            className={`ml-3 min-h-11 flex-1 rounded-xl text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
              selectedItems.length > 0 ? 'bg-purple04' : 'bg-grey03 text-grey04'
            }`}
          >
            삭제하기
          </button>
        </div>
      )}

      <DetailModal
        isOpen={isDetailOpen && selectedId !== null}
        onClose={() => setIsDetailOpen(false)}
        title="상세 혜택"
      >
        {selectedId !== null && (
          <div className="p-5 max-md:p-4">
            <BenefitDetailTabs
              benefitId={selectedId}
              image={selectedFavorite?.partnerImage ?? ''}
              name={selectedFavorite?.benefitName ?? ''}
              userCarrier={userCarrier}
              userGrade={userGrade}
            />
            {selectedFavorite ? (
              <Link
                to={`/mypage/activity?benefitId=${selectedFavorite.benefitId}`}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-accent px-4 text-sm font-semibold text-accentStrong transition-colors hover:bg-brandSoft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                사용 기록 남기기
              </Link>
            ) : null}
          </div>
        )}
      </DetailModal>
    </div>
  );
}
