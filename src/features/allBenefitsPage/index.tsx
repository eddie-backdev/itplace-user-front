import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { debounce } from 'lodash';
import { Link, useSearchParams } from 'react-router-dom';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import NoResult from '../../components/NoResult';
import SafeImage from '../../components/SafeImage';
import { TbChevronRight } from 'react-icons/tb';
import { showToast } from '../../utils/toast';
import {
  getPartnerBenefits,
  PartnerBenefitItem,
  PartnerBenefitApiParams,
} from './apis/allBenefitsApi';
import MobileHeader from '../../components/MobileHeader';
import { useResponsive } from '../../hooks/useResponsive';
import {
  CARRIER_OPTIONS,
  CarrierCode,
  getCarrierLabel,
  isCarrierCode,
} from '../../utils/membership';
import { CATEGORIES } from '../mainPage/constants';
import { getPartnerBenefitPath } from '../../utils/partnerSeo';

const ITEMS_PER_PAGE = 15;

const AllBenefitsLayout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialSearchTerm = searchParams.get('q')?.trim() ?? '';
  const initialCarrier = searchParams.get('carrier');
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearchTerm);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedCarriers, setSelectedCarriers] = useState<CarrierCode[]>(() =>
    isCarrierCode(initialCarrier) ? [initialCarrier] : []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [partners, setPartners] = useState<PartnerBenefitItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const { isMobile } = useResponsive();
  const latestRequestIdRef = useRef(0);

  // API 호출 함수
  const fetchBenefits = useCallback(
    async (page: number = 0, keyword?: string, category?: string, append = false) => {
      const requestId = ++latestRequestIdRef.current;
      setIsLoading(true);
      setLoadError(false);

      try {
        const params: PartnerBenefitApiParams = {
          mainCategory: 'BASIC_BENEFIT',
          page: page,
          size: ITEMS_PER_PAGE,
        };

        if (keyword) params.keyword = keyword;
        if (selectedCarriers.length > 0) params.carriers = selectedCarriers;
        if (category && category !== '전체') {
          params.category = category;
        }

        const data = await getPartnerBenefits(params);

        if (requestId !== latestRequestIdRef.current) return;

        setPartners((previousPartners) =>
          append ? [...previousPartners, ...data.content] : data.content
        );
        setTotalElements(data.totalElements);
        setHasNext(data.hasNext);
        setCurrentPage(data.currentPage + 1); // API는 0부터 시작, UI는 1부터 시작
      } catch {
        if (requestId !== latestRequestIdRef.current) return;
        showToast('혜택 데이터를 불러오는 중 오류가 발생했습니다', 'error');
        setLoadError(true);
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [selectedCarriers]
  );

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

  const handleCarrierChange = (carrier: CarrierCode | 'ALL') => {
    if (carrier === 'ALL') {
      setSelectedCarriers([]);
      setCurrentPage(1);
      return;
    }

    setSelectedCarriers((prevCarriers) =>
      prevCarriers.includes(carrier)
        ? prevCarriers.filter((selectedCarrier) => selectedCarrier !== carrier)
        : [...prevCarriers, carrier]
    );
    setCurrentPage(1);
  };

  // 페이지네이션 로직
  // 페이지 변경 핸들러
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    fetchBenefits(pageNumber - 1, debouncedSearchTerm, selectedCategory);
  };

  const handleLoadMore = () => {
    fetchBenefits(currentPage, debouncedSearchTerm, selectedCategory, true);
  };

  const carrierFilters: Array<{ code: CarrierCode | 'ALL'; label: string }> = [
    { code: 'ALL', label: '전체' },
    ...CARRIER_OPTIONS,
  ];

  const activeFilterCount = (selectedCategory !== '전체' ? 1 : 0) + selectedCarriers.length;

  const resetFilters = () => {
    setSelectedCategory('전체');
    setSelectedCarriers([]);
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-grey01/70 pb-5 pt-[54px] md:min-h-0 md:flex-1 md:overflow-y-auto md:bg-white md:pb-0 md:pt-0">
      {/* 모바일 헤더 */}
      <div className="fixed top-0 left-0 w-full z-[9999] max-md:block hidden">
        <MobileHeader title="전체 혜택" />
      </div>

      {/* 전체 레이아웃 컨테이너 */}
      <div className="w-full px-4 pb-8 pt-4 md:p-0">
        <div className="md:grid md:min-h-full md:grid-cols-[370px_minmax(0,1fr)] md:items-stretch">
          <aside
            className="md:sticky md:top-0 md:h-full md:overflow-y-auto md:border-r md:border-grey02 md:bg-white md:px-5 md:py-8"
            aria-label="혜택 탐색 패널"
          >
            <header className="mb-5 hidden md:block">
              <p className="text-body-3 font-bold text-purple04">혜택 탐색</p>
              <h1 className="mt-2 text-title-3 font-bold text-grey07">전체 혜택</h1>
              <p className="mt-2 break-keep text-body-3 leading-6 text-grey05">
                제휴처를 찾고 통신사별 멤버십 혜택을 확인해보세요.
              </p>
            </header>

            <section
              aria-label="혜택 검색 및 필터"
              className="rounded-[22px] border border-grey02 bg-white p-4 shadow-[0_10px_28px_rgba(16,17,20,0.04)] md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none"
            >
              <SearchBar
                placeholder="제휴처명으로 검색"
                value={searchTerm}
                onChange={handleSearchChange}
                onClear={() => setSearchTerm('')}
                className="h-[48px] w-full border border-grey02"
                backgroundColor="bg-grey01/70"
              />

              <div className="mt-4 border-t border-grey02 pt-4 md:mt-5 md:pt-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-body-4 font-bold text-grey06">통신사</p>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="min-h-10 rounded-lg px-2 text-body-4 font-bold text-purple04 transition-colors hover:bg-purple01 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
                    >
                      필터 초기화
                    </button>
                  )}
                </div>
                <div
                  className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0"
                  aria-label="통신사 필터"
                >
                  {carrierFilters.map((carrier) => {
                    const isSelected =
                      carrier.code === 'ALL'
                        ? selectedCarriers.length === 0
                        : selectedCarriers.includes(carrier.code);

                    return (
                      <button
                        key={carrier.code}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => handleCarrierChange(carrier.code)}
                        className={`min-h-10 shrink-0 rounded-full border px-4 text-body-4 font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 ${
                          isSelected
                            ? 'border-purple04 bg-purple04 text-white'
                            : 'border-grey02 bg-white text-grey06 hover:border-purple03 hover:text-purple05'
                        }`}
                      >
                        {carrier.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 border-t border-grey02 pt-4 md:mt-5 md:pt-5">
                <p className="mb-2 text-body-4 font-bold text-grey06">카테고리</p>
                <div
                  className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0"
                  aria-label="카테고리 필터"
                >
                  {categories.map((category) => {
                    const isSelected = selectedCategory === category.id;

                    return (
                      <button
                        key={category.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => handleCategoryChange(category.id)}
                        className={`min-h-10 shrink-0 rounded-full border px-3 text-body-4 font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 ${
                          isSelected
                            ? 'border-purple04 bg-purple04 text-white'
                            : 'border-grey02 bg-white text-grey06 hover:border-purple03 hover:text-purple05'
                        }`}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </aside>

          <section
            className="mt-10 min-w-0 md:mt-0 md:px-6 md:pb-14 md:pt-24 xl:px-8 2xl:px-10"
            aria-labelledby="benefit-results-title"
          >
            <div className="mb-3 flex min-h-10 items-center justify-between gap-3 md:mb-4">
              <div className="flex min-w-0 items-center gap-2">
                <h2
                  id="benefit-results-title"
                  className="text-title-6 font-bold text-grey07 md:text-title-5"
                >
                  혜택 제휴처
                </h2>
                <span className="shrink-0 text-body-4 font-medium text-grey05">
                  {totalElements.toLocaleString()}개
                </span>
              </div>
              {isLoading && partners.length > 0 && (
                <span className="shrink-0 text-body-4 font-medium text-purple04" role="status">
                  목록 업데이트 중
                </span>
              )}
            </div>

            <div
              className={`grid grid-cols-1 gap-3 transition-opacity md:gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ${
                isLoading && partners.length > 0 ? 'opacity-60' : 'opacity-100'
              }`}
              aria-busy={isLoading}
            >
              {isLoading && partners.length === 0 ? (
                Array.from({ length: ITEMS_PER_PAGE }, (_, index) => (
                  <div
                    key={index}
                    className="min-h-[116px] animate-pulse rounded-[18px] border border-grey02 bg-white p-3.5 md:min-h-[148px] md:p-4"
                    aria-hidden="true"
                  >
                    <div className="flex gap-4">
                      <div className="h-14 w-14 shrink-0 rounded-[14px] bg-grey02 md:h-16 md:w-16" />
                      <div className="flex-1 space-y-3 pt-1">
                        <div className="h-5 w-3/4 rounded bg-grey02" />
                        <div className="h-4 w-full rounded bg-grey01" />
                        <div className="h-4 w-2/3 rounded bg-grey01" />
                      </div>
                    </div>
                  </div>
                ))
              ) : partners.length > 0 ? (
                partners.map((partner) => (
                  <article
                    key={partner.partnerId}
                    className="group relative min-w-0 overflow-hidden rounded-[18px] border border-grey02 bg-white transition-all hover:border-purple02 hover:shadow-[0_10px_24px_rgba(16,17,20,0.06)]"
                  >
                    <Link
                      to={getPartnerBenefitPath(partner.partnerId, partner.partnerName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${partner.partnerName} 통신사별 혜택 새 탭에서 보기`}
                      className="flex min-h-[112px] w-full items-center gap-3 p-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple02 md:min-h-[132px] md:gap-4 md:p-4"
                    >
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-grey01 p-2 md:h-16 md:w-16">
                        <SafeImage
                          src={partner.image}
                          alt={`${partner.partnerName} 로고`}
                          fallbackLabel={partner.partnerName}
                          className="h-full w-full object-contain"
                        />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block line-clamp-1 text-[15px] font-bold leading-[1.4] text-grey07 md:text-[16px]">
                          {partner.partnerName}
                        </span>
                        <span className="mt-1 block text-body-4 font-medium text-grey05">
                          {partner.category || '카테고리 미분류'}
                        </span>
                        <span className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          {partner.carriers.map((carrier) => (
                            <span
                              key={carrier}
                              className="rounded-full bg-purple01 px-2.5 py-1 text-[11px] font-bold leading-none text-purple05"
                            >
                              {getCarrierLabel(carrier)}
                            </span>
                          ))}
                        </span>
                      </span>
                      <TbChevronRight
                        className="h-5 w-5 shrink-0 text-grey04 transition-transform group-hover:translate-x-0.5 group-hover:text-purple04"
                        aria-hidden="true"
                      />
                    </Link>
                  </article>
                ))
              ) : loadError ? (
                <div className="col-span-1 flex h-[320px] items-center justify-center lg:col-span-2 xl:col-span-3 2xl:col-span-4">
                  <NoResult
                    variant="error"
                    message1="혜택 제휴처를 불러오지 못했어요"
                    message2="잠시 후 다시 시도하거나 필터를 초기화한 뒤 확인해 주세요."
                    buttonText="다시 시도"
                    onButtonClick={() =>
                      fetchBenefits(currentPage - 1, debouncedSearchTerm, selectedCategory)
                    }
                    secondaryButtonText="필터 초기화"
                    onSecondaryButtonClick={resetFilters}
                    message1FontSize="text-title-4 max-xl:text-title-6"
                    message2FontSize="text-body-1 max-xl:text-body-3"
                  />
                </div>
              ) : (
                <div className="col-span-1 flex h-[320px] items-center justify-center lg:col-span-2 xl:col-span-3 2xl:col-span-4">
                  <NoResult
                    message1="앗! 일치하는 결과를 찾을 수 없어요!"
                    message2="다른 제휴처명이나 카테고리로 다시 찾아보세요."
                    message1FontSize="text-title-4 max-xl:text-title-6"
                    message2FontSize="text-body-1 max-xl:text-body-3"
                  />
                </div>
              )}
            </div>

            {isMobile ? (
              hasNext && partners.length > 0 ? (
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="min-h-12 w-full rounded-[14px] border border-purple02 bg-white px-5 text-body-3 font-bold text-purple05 transition-colors hover:bg-purple01 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 disabled:cursor-wait disabled:opacity-60"
                  >
                    {isLoading ? '혜택을 불러오는 중' : '혜택 더 보기'}
                  </button>
                </div>
              ) : null
            ) : (
              <div className="mt-8 flex justify-center md:mt-10">
                <Pagination
                  currentPage={currentPage}
                  itemsPerPage={ITEMS_PER_PAGE}
                  totalItems={totalElements}
                  onPageChange={handlePageChange}
                  compact
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AllBenefitsLayout;
