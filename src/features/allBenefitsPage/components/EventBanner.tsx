import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/swiper-bundle.css';
import { useResponsive } from '../../../hooks/useResponsive';

const images = ['/images/allBenefits/event1.png', '/images/allBenefits/event2.png'];
const images2 = ['/images/allBenefits/event1-1.png', '/images/allBenefits/event2-2.png'];

interface EventBannerProps {
  className?: string;
}

const EventBanner: React.FC<EventBannerProps> = ({ className = '' }) => {
  const { isMobile } = useResponsive();

  const renderImages = isMobile ? images2 : images;

  return (
    <div
      className={`w-full overflow-hidden rounded-[28px] shadow-[0_20px_50px_rgba(17,24,39,0.08)] md:h-[220px] xl:h-[250px] max-md:h-[110px] max-md:rounded-none max-md:shadow-none ${className}`}
    >
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={30}
        slidesPerView={1}
        loop={true}
        pagination={{
          clickable: true,
          el: '.swiper-pagination',
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        className="w-full h-full rounded-[28px] max-md:rounded-none"
      >
        {renderImages.map((src, idx) => (
          <SwiperSlide key={idx}>
            <a
              href={
                idx === 0 ? 'https://www.lguplus.com/ujam/95' : 'https://www.lguplus.com/ujam/155'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-full"
            >
              <img
                src={src}
                alt={`benefit-${idx + 1}`}
                className="h-full w-full object-cover md:object-fill"
              />
            </a>
          </SwiperSlide>
        ))}

        {/* 페이지네이션 */}
        <div className="swiper-pagination !bottom-3 max-md:hidden"></div>
      </Swiper>
    </div>
  );
};

export default EventBanner;
