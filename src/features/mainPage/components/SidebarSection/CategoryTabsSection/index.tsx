import React, { useMemo, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { FreeMode } from 'swiper/modules';
import { Category } from '../../../types';
import { LAYOUT } from '../../../constants';
import {
  TbHeart,
  TbShoppingBag,
  TbHome,
  TbToolsKitchen2,
  TbMovie,
  TbBook,
  TbPlane,
  TbBuildingCarousel,
  TbChevronLeft,
  TbChevronRight,
} from 'react-icons/tb';
import 'swiper/swiper-bundle.css';

type CategoryTabsMode = 'map' | 'sidebar';

interface CategoryTabsSectionProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  mode?: CategoryTabsMode;
  showNavigationButtons?: boolean;
}

// 카테고리 색상 매핑
const CATEGORY_COLOR_MAP: Record<string, string> = {
  엑티비티: 'text-purple04',
  '뷰티/건강': 'text-orange04',
  쇼핑: 'text-pink04',
  '생활/편의': 'text-purple04',
  푸드: 'text-orange04',
  '문화/여가': 'text-pink04',
  교육: 'text-purple04',
  '여행/교통': 'text-orange04',
};

const getCategoryIcon = (
  categoryId: string,
  isSelected: boolean
): React.ReactElement | undefined => {
  const iconColor = isSelected ? 'text-white' : CATEGORY_COLOR_MAP[categoryId] || 'text-grey05';
  const iconSize = isSelected
    ? window.innerWidth < 768
      ? 16
      : 20
    : window.innerWidth < 768
      ? 14
      : 20;

  const iconMap: Record<string, React.ReactElement> = {
    엑티비티: <TbBuildingCarousel size={iconSize} className={iconColor} />,
    '뷰티/건강': <TbHeart size={iconSize} className={iconColor} />,
    쇼핑: <TbShoppingBag size={iconSize} className={iconColor} />,
    '생활/편의': <TbHome size={iconSize} className={iconColor} />,
    푸드: <TbToolsKitchen2 size={iconSize} className={iconColor} />,
    '문화/여가': <TbMovie size={iconSize} className={iconColor} />,
    교육: <TbBook size={iconSize} className={iconColor} />,
    '여행/교통': <TbPlane size={iconSize} className={iconColor} />,
  };
  return iconMap[categoryId];
};

const CategoryTabsSection: React.FC<CategoryTabsSectionProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  mode = 'map',
  showNavigationButtons = false,
}) => {
  const swiperRef = useRef<SwiperType | null>(null);
  // 모드별 스타일 메모이제이션
  const styles = useMemo(() => {
    const isMapMode = mode === 'map';
    const isSidebarMode = mode === 'sidebar';

    return {
      container: `flex items-center ${isSidebarMode ? 'gap-2' : 'gap-3'} overflow-x-auto scrollbar-hide pb-2`,
      button: `select-none flex-shrink-0 py-2 flex items-center justify-center gap-2 font-medium transition-colors duration-200 border-none ${
        isSidebarMode
          ? `h-[${LAYOUT.CATEGORY_TAB_HEIGHT_COMPACT}px] px-4 rounded-[20px] text-body-2 shadow-[0_2px_4px_rgba(16,17,20,0.16)] max-xl:h-[32px] max-xl:px-3 max-xl:text-body-3 max-sm:h-[30px] max-sm:px-4 max-sm:text-body-3` // 사이드바: 더 작게
          : `h-[${LAYOUT.CATEGORY_TAB_HEIGHT}px] px-6 rounded-[30px] text-body-2 shadow-[0_2px_4px_rgba(16,17,20,0.16)] max-xl:h-[36px] max-xl:px-4 max-xl:text-body-3 max-xl:gap-1 max-sm:h-[33px] max-sm:px-4 max-sm:text-body-3 max-sm:gap-0.5` // 맵: 더 작게
      }`,
      showIcon: isMapMode, // 맵 모드에서만 아이콘 표시
    };
  }, [mode]);

  const handlePrevSlide = () => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
    }
  };

  const handleNextSlide = () => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  };

  // 모든 모드에서 스와이퍼 사용
  return (
    <div className="relative">
      <div
        className={
          mode === 'map'
            ? 'px-0 pt-2 pb-2 h-20 max-md:h-14 max-md:pt-1 max-md:pb-1 max-sm:h-12 max-sm:pt-0.5 max-sm:pb-0.5'
            : 'px-2 h-15 max-md:h-12 max-md:px-1 max-sm:h-10 max-sm:px-0.5 max-sm:mx-3  max-md:w-auto max-md:overflow-visible max-md:mx-4 '
        }
      >
        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          modules={[FreeMode]}
          spaceBetween={
            mode === 'sidebar'
              ? window.innerWidth < 640
                ? 12
                : window.innerWidth < 768
                  ? 14
                  : 8
              : window.innerWidth < 640
                ? 6
                : window.innerWidth < 768
                  ? 8
                  : 12
          }
          slidesPerView="auto"
          freeMode={true}
          grabCursor={true}
          className={`category-tabs-swiper ${mode === 'map' ? 'h-16 max-md:h-12 max-sm:h-10' : 'h-14 max-md:h-10 max-sm:h-10'}`}
        >
          {categories.map((category) => (
            <SwiperSlide key={category.id} style={{ width: 'auto' }}>
              <button
                onClick={() => onCategorySelect(category.id)}
                className={`${styles.button} ${
                  selectedCategory === category.id
                    ? 'bg-purple04 text-white'
                    : 'bg-white text-grey05 hover:bg-purple02'
                }`}
              >
                {styles.showIcon && category.id !== '전체' && (
                  <span className="flex-shrink-0">
                    {getCategoryIcon(category.id, selectedCategory === category.id)}
                  </span>
                )}
                <span className="whitespace-nowrap">{category.name}</span>
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* 네비게이션 버튼 (관심혜택 모드에서만 표시) */}
      {showNavigationButtons && (
        <div className="flex justify-end items-center gap-1 -mt-2 px-2 max-md:px-4 max-sm:px-3">
          <button
            onClick={handlePrevSlide}
            className="p-1 transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="이전 카테고리"
          >
            <TbChevronLeft className="w-5 h-5 max-md:w-4 max-md:h-4 max-sm:w-3 max-sm:h-3 text-purple04 hover:text-purple05" />
          </button>

          <button
            onClick={handleNextSlide}
            className="p-1 transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="다음 카테고리"
          >
            <TbChevronRight className="w-5 h-5 max-md:w-4 max-md:h-4 max-sm:w-3 max-sm:h-3 text-purple04 hover:text-purple05" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryTabsSection;
