import React from 'react';
import SimpleRanking from './components/SimpleRanking';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import BenefitFilterToggle from '../../components/BenefitFilterToggle';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import NoResult from '../../components/NoResult';
import { TbStar, TbStarFilled } from 'react-icons/tb';
import { showToast } from '../../utils/toast';
import {
  getBenefits,
  addFavorite,
  removeFavorite,
  BenefitItem,
  TierBenefit,
  BenefitApiParams,
} from './apis/allBenefitsApi';
import BenefitDetailModal from './components/BenefitDetailModal';
import MobileHeader from '../../components/MobileHeader';
import { useResponsive } from '../../hooks/useResponsive';
import { CARRIER_OPTIONS, CarrierCode, getCarrierLabel } from '../../utils/membership';
import { CATEGORIES } from '../mainPage/constants';

type CarrierFilter = 'ALL' | CarrierCode;

const AllBenefitsLayout: React.FC = () => {
  const [filter, setFilter] = useState<'default' | 'vipkok'>('default');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierFilter>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [benefits, setBenefits] = useState<BenefitItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedBenefit, setSelectedBenefit] = useState<BenefitItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const { isMobile } = useResponsive();

  // API 호출 함수
  const fetchBenefits = useCallback(
    async (page: number = 0, keyword?: string, category?: string) => {
      setIsLoading(true);
      setLoadError(false);
      // 로딩 시작 시 기존 결과를 유지하지 않고 초기화
      setBenefits([]);
      setTotalElements(0);

      try {
        const params: BenefitApiParams = {
          mainCategory: filter === 'vipkok' ? 'VIP_COCK' : 'BASIC_BENEFIT',
          page: page,
          size: 9, // 3x3 그리드
        };

        if (keyword) params.keyword = keyword;
        if (selectedCarrier !== 'ALL') params.carrier = selectedCarrier;
        if (category && category !== '전체') {
          params.category = category;
        }

        const data = await getBenefits(params);

        setBenefits(data.content);
        setTotalElements(data.totalElements);
        setCurrentPage(data.currentPage + 1); // API는 0부터 시작, UI는 1부터 시작

        // 초기 즐겨찾기 상태 설정 (API에서 받아온 데이터 기준)
        const favoriteIds = data.content
          .filter((benefit: BenefitItem) => benefit.isFavorite)
          .map((benefit: BenefitItem) => benefit.benefitId);
        setFavorites(favoriteIds);
      } catch {
        showToast('혜택 데이터를 불러오는 중 오류가 발생했습니다', 'error');
        setLoadError(true);
        setBenefits([]);
        setTotalElements(0);
      } finally {
        setIsLoading(false);
      }
    },
    [filter, selectedCarrier]
  );

  // 즐겨찾기 토글 함수
  const toggleFavorite = useCallback(
    async (benefitId: number) => {
      try {
        const isCurrentlyFavorite = favorites.includes(benefitId);
        if (isCurrentlyFavorite) {
          // 즐겨찾기 삭제
          await removeFavorite(benefitId);
          setFavorites((prev) => prev.filter((id) => id !== benefitId));
          showToast('관심 혜택에서 삭제되었습니다', 'info');
        } else {
          // 즐겨찾기 추가
          await addFavorite(benefitId);
          setFavorites((prev) => [...prev, benefitId]);
          showToast('관심 혜택에 추가되었습니다', 'success');
        }

        // 혜택 목록의 즐겨찾기 상태도 업데이트
        setBenefits((prev) =>
          prev.map((benefit) =>
            benefit.benefitId === benefitId
              ? { ...benefit, isFavorite: !benefit.isFavorite }
              : benefit
          )
        );
      } catch {
        showToast('관심 혜택 처리 중 오류가 발생했습니다', 'error');
      }
    },
    [favorites]
  );

  // 카드 클릭 핸들러
  const handleCardClick = (benefit: BenefitItem) => {
    setSelectedBenefit(benefit);
    setIsModalOpen(true);
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBenefit(null);
  };

  // 모달이 열릴 때 뒷배경 스크롤 방지
  useEffect(() => {
    if (isModalOpen) {
      // 현재 스크롤 위치 저장
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('data-scroll-y', scrollY.toString());
    } else {
      // 스크롤 위치 복원
      const scrollY = document.body.getAttribute('data-scroll-y');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.body.removeAttribute('data-scroll-y');
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
      }
    }
    return () => {
      // 컴포넌트 언마운트 시 정리
      const scrollY = document.body.getAttribute('data-scroll-y');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.body.removeAttribute('data-scroll-y');
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
      }
    };
  }, [isModalOpen]);

  // 초기 데이터 로드
  useEffect(() => {
    fetchBenefits(0, debouncedSearchTerm, selectedCategory);
  }, [fetchBenefits, debouncedSearchTerm, selectedCategory]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // 디바운스된 검색 함수
  const debouncedSearch = useMemo(
    () =>
      debounce((searchQuery: string) => {
        setDebouncedSearchTerm(searchQuery);
      }, 500),
    []
  );

  // 검색어 변경 시 디바운스 적용
  useEffect(() => {
    debouncedSearch(searchTerm);

    // cleanup 함수로 디바운스 취소
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  const categories = CATEGORIES;

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleCarrierChange = (carrier: CarrierFilter) => {
    setSelectedCarrier(carrier);
    setCurrentPage(1);
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, benefit: BenefitItem) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick(benefit);
    }
  };

  // 페이지네이션 로직
  const itemsPerPage = 9;

  // 페이지 변경 핸들러
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    fetchBenefits(pageNumber - 1, debouncedSearchTerm, selectedCategory);
  };

  // 혜택 설명 표시를 위한 헬퍼 함수
  const getBenefitDescription = (tierBenefits: TierBenefit[]) => {
    // 가장 적절한 등급의 혜택을 선택 (예: BASIC 등급)
    const basicBenefit = tierBenefits.find((benefit) => benefit.grade === 'BASIC');
    return basicBenefit ? basicBenefit.context : tierBenefits[0]?.context || '';
  };

  const carrierFilters: Array<{ code: CarrierFilter; label: string }> = [
    { code: 'ALL', label: '통신 3사 전체' },
    ...CARRIER_OPTIONS,
  ];

  const activeFilterCount =
    (selectedCategory !== '전체' ? 1 : 0) +
    (filter !== 'default' ? 1 : 0) +
    (selectedCarrier !== 'ALL' ? 1 : 0);

  return (
    <div className="overflow-x-hidden bg-white pt-[54px] md:pt-0">
      {/* 모바일 헤더 */}
      <div className="fixed top-0 left-0 w-full z-[9999] max-md:block hidden">
        <MobileHeader title="전체 혜택" />
      </div>

      {/* 전체 레이아웃 컨테이너 */}
      <div className="mx-auto w-full max-w-[1280px] px-5 pb-10 pt-6 md:px-7 md:pb-14 md:pt-10">
        <section className="mb-8 md:mb-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
            <div className="hidden md:block">
              <p className="text-body-3 font-medium text-purple04">혜택 탐색</p>
              <div className="mt-2 flex items-center gap-4">
                <h1 className="text-title-2 text-black">전체 혜택</h1>
              </div>
              <p className="mt-3 max-w-[520px] text-body-2 text-grey05">
                가장 중요한 혜택 목록을 먼저 보고, 필요한 조건만 빠르게 좁혀볼 수 있도록 구성을
                정리했어요.
              </p>
            </div>

            <div className="w-full md:mt-2 md:flex md:max-w-[380px] md:flex-shrink-0 md:items-center md:justify-end">
              <SearchBar
                placeholder="제휴처 검색"
                value={searchTerm}
                onChange={handleSearchChange}
                onClear={() => setSearchTerm('')}
                className="h-[44px] w-full md:w-[380px]"
                backgroundColor="bg-grey01"
              />
            </div>
          </div>
        </section>

        <section className="border-b border-grey01 pb-6 md:pb-7">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <p className="text-body-4 font-medium text-grey04">통신사 필터</p>
                <span className="rounded-full bg-grey01 px-2.5 py-1 text-[12px] font-medium leading-none text-grey04">
                  LG U+ · SKT · KT
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {carrierFilters.map((carrier) => (
                  <button
                    key={carrier.code}
                    type="button"
                    onClick={() => handleCarrierChange(carrier.code)}
                    className={`rounded-full border px-3.5 py-1.5 text-body-4 transition-colors md:px-4 ${
                      selectedCarrier === carrier.code
                        ? 'border-purple04 bg-purple01 text-purple04'
                        : 'border-grey02 bg-white text-grey04 hover:border-purple02 hover:text-purple04'
                    }`}
                  >
                    {carrier.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <p className="text-body-4 font-medium text-grey04">카테고리 필터</p>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-purple01 px-2.5 py-1 text-[12px] font-medium leading-none text-purple04">
                  {activeFilterCount}개 적용
                </span>
              )}
            </div>

            <div className="pt-1">
              <div className="flex flex-wrap items-center gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryChange(category.id)}
                    className={`rounded-full border px-3.5 py-1.5 text-body-4 transition-colors md:px-4 ${
                      selectedCategory === category.id
                        ? 'border-purple04 bg-purple01 text-purple04'
                        : 'border-grey02 bg-white text-grey04 hover:border-purple02 hover:text-purple04'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 md:mt-10">
          <div className="mb-4">
            <BenefitFilterToggle
              value={filter}
              onChange={setFilter}
              width="w-full md:w-[190px]"
              className="mb-0"
              fontSize="text-body-4"
              heightClass="h-[34px]"
            />
          </div>

          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2">
              <p className="text-body-4 font-medium text-purple04">혜택 목록</p>
              <h2 className="text-title-5 text-black">한눈에 확인하고 자세히 비교해보세요.</h2>
            </div>

            <p className="text-body-3 text-grey04 lg:self-center">
              총 {totalElements.toLocaleString()}개 혜택
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
            {isLoading ? (
              <div className="col-span-1 flex h-[320px] items-center justify-center md:col-span-2 xl:col-span-3">
                <LoadingSpinner />
              </div>
            ) : benefits.length > 0 ? (
              benefits.map((benefit) => (
                <div
                  key={benefit.benefitId}
                  role="button"
                  tabIndex={0}
                  aria-label={`${benefit.benefitName} 혜택 상세 보기`}
                  className="group relative flex min-h-[188px] cursor-pointer flex-col justify-between rounded-[24px] border border-grey01 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(15,23,42,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 md:min-h-[200px]"
                  onClick={() => handleCardClick(benefit)}
                  onKeyDown={(event) => handleCardKeyDown(event, benefit)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(benefit.benefitId);
                    }}
                    aria-label={
                      benefit.isFavorite || favorites.includes(benefit.benefitId)
                        ? '관심 혜택에서 제거'
                        : '관심 혜택에 추가'
                    }
                    className="absolute right-5 top-5 text-orange03 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
                  >
                    {benefit.isFavorite || favorites.includes(benefit.benefitId) ? (
                      <TbStarFilled className="h-6 w-6" />
                    ) : (
                      <TbStar className="h-6 w-6" />
                    )}
                  </button>

                  <div className="pr-10">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-purple01 px-2.5 py-1 text-[12px] font-medium leading-none text-purple04">
                        {getCarrierLabel(benefit.carrier)}
                      </span>
                      <span className="text-body-4 text-grey04">
                        {benefit.usageType === 'ONLINE' ? '온라인' : '오프라인'} ·{' '}
                        {benefit.category}
                      </span>
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-title-5 text-black md:text-title-6">
                      {benefit.benefitName}
                    </h3>
                    <p
                      className="mt-3 overflow-hidden text-body-3 text-grey05 md:text-body-4"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {getBenefitDescription(benefit.tierBenefits)}
                    </p>
                  </div>

                  <div className="mt-6 flex items-end justify-between gap-4">
                    <p className="line-clamp-1 text-body-4 text-grey03">
                      상세 조건은 카드 클릭 후 확인할 수 있어요
                    </p>
                    <div className="flex h-[64px] w-[64px] flex-shrink-0 items-center justify-center md:h-[72px] md:w-[72px]">
                      <img
                        src={benefit.image || '/images/admin/CGV.png'}
                        alt={`${benefit.benefitName} 로고`}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : loadError ? (
              <div className="col-span-1 flex h-[320px] items-center justify-center md:col-span-2 xl:col-span-3">
                <NoResult
                  variant="error"
                  message1="혜택 목록을 불러오지 못했어요"
                  message2="잠시 후 다시 시도하거나 필터를 초기화한 뒤 확인해 주세요."
                  buttonText="다시 시도"
                  onButtonClick={() =>
                    fetchBenefits(currentPage - 1, debouncedSearchTerm, selectedCategory)
                  }
                  secondaryButtonText="필터 초기화"
                  onSecondaryButtonClick={() => {
                    setSelectedCategory('전체');
                    setSelectedCarrier('ALL');
                    setFilter('default');
                    setSearchTerm('');
                    setDebouncedSearchTerm('');
                    setCurrentPage(1);
                  }}
                  message1FontSize="text-title-4 max-xl:text-title-6"
                  message2FontSize="text-body-1 max-xl:text-body-3"
                />
              </div>
            ) : (
              <div className="col-span-1 flex h-[320px] items-center justify-center md:col-span-2 xl:col-span-3">
                <NoResult
                  message1="앗! 일치하는 결과를 찾을 수 없어요!"
                  message2="다른 키워드나 혜택으로 다시 찾아보세요."
                  message1FontSize="text-title-4 max-xl:text-title-6"
                  message2FontSize="text-body-1 max-xl:text-body-3"
                />
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-center md:mt-10">
            <Pagination
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalElements}
              onPageChange={handlePageChange}
              width={isMobile ? 'calc(100vw - 40px)' : '100%'}
            />
          </div>
        </section>

        <section className="mt-12 space-y-5 border-t border-grey01 pt-8 md:mt-16 md:space-y-6 md:pt-10">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-body-4 font-medium text-purple04">추가 탐색</p>
              <h2 className="mt-1 text-title-5 text-black">인기 혜택을 함께 살펴보세요.</h2>
            </div>
            <p className="text-body-3 text-grey04">
              메인 목록 확인 후 참고할 수 있는 보조 콘텐츠예요.
            </p>
          </div>

          <SimpleRanking />
        </section>
      </div>

      {/* 상세 모달 */}
      <BenefitDetailModal
        isOpen={isModalOpen}
        benefit={selectedBenefit}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default AllBenefitsLayout;
