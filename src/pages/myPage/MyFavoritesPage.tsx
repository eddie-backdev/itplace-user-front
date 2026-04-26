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
  } = useFavorites(6);

  const userGrade = useSelector((state: RootState) => state.auth.user?.membershipGrade);
  const { isMobile } = useResponsive();

  return (
    <div className="flex flex-row gap-[28px] w-full h-full max-lg:flex-col max-md:flex-col-reverse max-md:px-5 max-md:pb-7 max-md:pt-[20px]">
      <MyPageContentLayout
        // ✨ MainContent 영역

        main={
          <div
            className={`flex flex-col flex-1 h-full ${isMobile && isEditing ? 'pb-[80px]' : ''}`}
          >
            {/* 상단 타이틀 */}
            <h1 className="text-title-2 text-black mb-7 max-xl:text-title-4 max-xl:mb-4 max-xl:font-semibold max-md:hidden">
              관심 혜택
            </h1>
            {/* 토글 + 검색 */}
            <div className="flex justify-between mb-[-10px] max-md:flex-col max-md:-mt-8">
              <BenefitFilterToggle
                value={benefitFilter}
                onChange={setBenefitFilter}
                width="w-[300px] max-xl:w-[175px] max-xlg:w-[180px] max-md:w-full"
                fontSize="text-title-7 max-xl:text-body-3"
              />
              <SearchBar
                placeholder="제휴처명으로 검색하기"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onClear={() => setKeyword('')}
                backgroundColor="bg-grey01"
                className="w-[280px] h-[50px] max-xl:w-[220px] max-xl:h-[44px] max-lg:w-[220px] max-md:w-full max-md:-mt-2"
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
              <div className="flex justify-center items-center h-full">
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
                  message1="찜 보관함이 텅 비었어요!"
                  message2="마음에 드는 혜택을 찜해보세요."
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
              userGrade={userGrade}
              loading={loading}
            />
          </div>
        }
        bottomImage="/images/myPage/bunny-favorites.webp"
        bottomImageAlt="찜한 혜택 토끼"
        bottomImageFallback="/images/myPage/bunny-favorites.png"
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
              userGrade={userGrade}
            />
          </div>
        </div>
      )}
    </div>
  );
}
