import { useFavorites } from '../../features/myPage/hooks/useFavorites';
import { LoadingSpinner, Pagination } from '../../components';
import BenefitFilterToggle from '../../components/BenefitFilterToggle';
import SearchBar from '../../components/SearchBar';
import NoResult from '../../components/NoResult';
import BenefitCardList from '../../features/myPage/components/Favorites/BenefitCardList';
import EditControls from '../../features/myPage/components/Favorites/EditControls';
import MyPageContentLayout from '../../features/myPage/layout/MyPageContentLayout';
import FavoritesDeleteModal from '../../features/myPage/components/Favorites/FavoritesDeleteModal';
import FavoritesAside from '../../features/myPage/components/Favorites/FavoritesAside';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import BenefitDetailTabs from '../../features/myPage/components/Favorites/BenefitDetailTabs';
import { IoCloseOutline } from 'react-icons/io5';
import { useResponsive } from '../../hooks/useResponsive';

export default function MyFavoritesPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const userCarrier = user?.carrier;
  const userGrade = user?.membershipGradeCode ?? user?.membershipGrade;
  const { isMobile } = useResponsive();

  const {
    loading,
    loadError,
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

  return (
    <div className="flex h-[640px] flex-row items-stretch gap-4 w-full max-lg:h-auto max-lg:flex-col max-md:flex-col-reverse max-md:px-5 max-md:pb-7 max-md:pt-3">
      <MyPageContentLayout
        // ✨ MainContent 영역

        main={
          <div
            className={`flex min-h-0 flex-1 flex-col ${isMobile && isEditing ? 'pb-[80px]' : ''}`}
          >
            {/* 상단 타이틀 */}
            <div className="mb-4 max-md:hidden">
              <p className="text-body-3-bold text-purple03">FAVORITES</p>
              <h1 className="mt-1 text-title-4 font-semibold text-black">관심 혜택</h1>
            </div>
            {/* 토글 + 검색 */}
            <div className="flex justify-between mb-2 gap-2 max-md:flex-col max-md:-mt-8">
              <BenefitFilterToggle
                value={benefitFilter}
                onChange={setBenefitFilter}
                width="w-[240px] max-xl:w-[210px] max-xlg:w-[200px] max-md:w-full"
                fontSize="text-title-7 max-xl:text-body-3"
                disabledMyMembership={!hasMembershipProfile}
              />
              <SearchBar
                placeholder="제휴처명으로 검색하기"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onClear={() => setKeyword('')}
                backgroundColor="bg-grey01"
                className="w-[240px] h-[44px] max-xl:w-[210px] max-xl:h-[42px] max-lg:w-[210px] max-md:w-full max-md:-mt-2"
              />
            </div>
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
            검색어가 없고 목록도 없을 때는 "찜한 혜택이 없음" 표시 */}
            {loading ? (
              // 로딩 중
              <div className="flex justify-center items-center min-h-[220px]">
                <LoadingSpinner />
              </div>
            ) : loadError ? (
              <div className="mt-28 max-xl:mt-20">
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
                <div className="mt-28 max-xl:mt-20">
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
                  selectedId={selectedId}
                  setSelectedId={setSelectedId}
                  isEditing={isEditing}
                  selectedItems={selectedItems}
                  setSelectedItems={setSelectedItems}
                  onRemove={handleRemoveFavorite}
                  onRequestDelete={(id: number) => {
                    setPendingDeleteId(id);
                    setIsDeleteModalOpen(true);
                  }}
                />
              )
            ) : allFavorites.length === 0 ? (
              <div className="mt-28 max-xl:mt-20">
                <NoResult
                  message1={
                    benefitFilter === 'myMembership'
                      ? '내 멤버십에 맞는 관심 혜택이 없어요'
                      : '찜 보관함이 텅 비었어요!'
                  }
                  message2={
                    benefitFilter === 'myMembership'
                      ? hasMembershipProfile
                        ? '전체 혜택으로 전환하거나 다른 혜택을 찜해보세요.'
                        : '회원 정보에서 통신사와 등급을 먼저 선택해 주세요.'
                      : '마음에 드는 혜택을 찜해보세요.'
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
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                isEditing={isEditing}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
                onRemove={handleRemoveFavorite}
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
              <div className="mt-auto relative flex justify-center items-end max-md:mt-3 max-md:mb-6">
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
                      className="px-4 py-2 rounded-[16px] bg-grey01 hover:bg-grey02 text-title-8 text-grey04 max-xl:text-body-5"
                    >
                      편집 취소
                    </button>
                    <button
                      onClick={() => {
                        setPendingDeleteId(null);
                        setIsDeleteModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-[16px] bg-purple04 hover:bg-purple05 text-title-8 text-white max-xl:text-body-5"
                    >
                      삭제하기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        }
        // ✨ RightAside 영역
        aside={
          <div className="max-md:hidden">
            <FavoritesAside
              favorites={allFavorites}
              isEditing={isEditing}
              selectedItems={selectedItems}
              selectedId={selectedId}
              userCarrier={userCarrier}
              userGrade={userGrade}
              loading={loading}
            />
          </div>
        }
      />

      {/* ✅ 모바일에서만, 편집 모드일 때 하단 고정 버튼 */}
      {isMobile && isEditing && (
        <div className="fixed bottom-0 left-0 w-full bg-white p-4 flex border-grey03 z-[9999]">
          <button
            onClick={() => {
              setIsEditing(false);
              setSelectedItems([]);
            }}
            className="px-7 py-3 rounded-[12px] bg-white border border-grey02 text-grey03 text-body-3 font-medium"
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
            className={`flex-1 py-3 ml-3 rounded-[12px] text-body-3 font-medium text-white transition-colors ${
              selectedItems.length > 0 ? 'bg-purple04' : 'bg-grey03 text-grey04'
            }`}
          >
            삭제하기
          </button>
        </div>
      )}

      {/* ✅ 모바일에서만 모달로 BenefitDetailTabs */}
      {isMobile && selectedId && (
        <div
          className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-5"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="bg-white rounded-[18px] w-full max-w-[calc(100%-10px)] max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center mb-6">
              <h1 className="flex-1 text-center text-black text-title-5 font-semibold">
                상세 혜택
              </h1>
              <button className=" text-grey05 -mt-2 -ml-6" onClick={() => setSelectedId(null)}>
                <IoCloseOutline size={26} />
              </button>
            </div>
            <BenefitDetailTabs
              benefitId={selectedId}
              image={allFavorites.find((f) => f.benefitId === selectedId)?.partnerImage ?? ''}
              name={allFavorites.find((f) => f.benefitId === selectedId)?.benefitName ?? ''}
              userCarrier={userCarrier}
              userGrade={userGrade}
            />
          </div>
        </div>
      )}
    </div>
  );
}
