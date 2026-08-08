import React, { useMemo, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { FreeMode } from 'swiper/modules';
import { Category } from '../../../types';
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
  엑티비티: 'text-brand',
  '뷰티/건강': 'text-brand',
  쇼핑: 'text-brand',
  '생활/편의': 'text-brand',
  푸드: 'text-brand',
  '문화/여가': 'text-brand',
  교육: 'text-brand',
  '여행/교통': 'text-brand',
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
      container: `flex items-center ${isSidebarMode ? 'gap-2' : 'gap-3'} overflow-x-auto scrollbar-hide`,
      button: `select-none flex-shrink-0 flex items-center justify-center gap-1.5 border font-bold transition-colors duration-200 ${
        isSidebarMode
          ? `h-9 rounded-full px-3 text-body-3 max-sm:h-8 max-sm:px-3 max-sm:text-body-4`
          : `h-11 rounded-xl px-5 text-body-3 shadow-[0_3px_12px_rgba(36,35,33,0.08)] max-xl:h-10 max-xl:px-4 max-sm:h-9 max-sm:px-3 max-sm:text-body-4`
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
            ? 'h-14 px-0 py-1 max-md:h-12 max-sm:h-11'
            : 'h-12 px-0 max-md:mx-4 max-md:h-10 max-md:w-auto max-md:overflow-visible max-sm:mx-3'
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
          className={`category-tabs-swiper ${mode === 'map' ? 'h-12 max-md:h-11 max-sm:h-10' : 'h-11 max-md:h-10'}`}
        >
          {categories.map((category) => (
            <SwiperSlide key={category.id} style={{ width: 'auto' }}>
              <button
                onClick={() => onCategorySelect(category.id)}
                className={`${styles.button} ${
                  selectedCategory === category.id
                    ? 'border-brand bg-brand text-white'
                    : 'border-warmBorder bg-warmSurface text-grey06 hover:border-brand/30 hover:bg-brandSoft'
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
            <TbChevronLeft className="h-5 w-5 text-brand hover:text-brandStrong max-md:h-4 max-md:w-4 max-sm:h-3 max-sm:w-3" />
          </button>

          <button
            onClick={handleNextSlide}
            className="p-1 transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="다음 카테고리"
          >
            <TbChevronRight className="h-5 w-5 text-brand hover:text-brandStrong max-md:h-4 max-md:w-4 max-sm:h-3 max-sm:w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryTabsSection;
