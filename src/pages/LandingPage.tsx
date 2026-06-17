import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { debounce } from 'lodash';
import { lazy, useEffect, useLayoutEffect, useRef, useState } from 'react';
import MobileHeader from '../components/MobileHeader';
import CustomCursor from '../features/landingPage/components/CustomCursor';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

import Intro from '../features/landingPage/components/Intro';
import HeroSection from '../features/landingPage/sections/HeroSection';
const FeatureSection = lazy(() => import('../features/landingPage/sections/FeatureSection'));
const VideoSection = lazy(() => import('../features/landingPage/sections/VideoSection'));
const StartCTASection = lazy(() => import('../features/landingPage/sections/StartCTASection'));

const LandingPage = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);
  const [iconColor, setIconColor] = useState<'text-white' | 'text-black'>('text-white');
  const ctaRef = useRef<HTMLDivElement>(null);

  // 윈도우 리사이즈 핸들러
  useEffect(() => {
    const handleResize = debounce(() => {
      ScrollTrigger.refresh();
    }, 400);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 초기 스크롤 위치 설정
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = 'auto';

    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  // 로딩 완료 후 처리
  useEffect(() => {
    if (!showIntro) {
      // 스크롤 위치 재설정
      window.scrollTo(0, 0);
      document.body.style.overflow = 'visible';

      // ScrollTrigger 초기화를 여러 단계로 나누어 실행
      const timers = [
        setTimeout(() => {
          window.scrollTo(0, 0);
          ScrollTrigger.refresh(true);
        }, 100),
        setTimeout(() => {
          ScrollTrigger.refresh();
        }, 300),
        setTimeout(() => {
          // 마지막으로 한 번 더 새로고침
          ScrollTrigger.update();
          ScrollTrigger.refresh();
        }, 500),
      ];

      return () => timers.forEach((timer) => clearTimeout(timer));
    }
  }, [showIntro]);

  // 비디오 종료 후 스크롤 맨 아래로 이동
  useEffect(() => {
    if (videoEnded) {
      gsap.to(window, {
        scrollTo: { y: 'max', autoKill: false },
        duration: 0.6,
        ease: 'power2.inOut',
      });
    }
  }, [videoEnded]);

  // CTA만 검정색 헤더
  useEffect(() => {
    if (!showIntro && videoEnded && ctaRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIconColor('text-black');
          } else {
            setIconColor('text-white');
          }
        },
        {
          threshold: 0.3,
        }
      );

      observer.observe(ctaRef.current);

      return () => observer.disconnect();
    }
  }, [showIntro, videoEnded]);

  const handleLoadingFinish = () => {
    // 로딩 완료 시 스크롤 위치 확인
    window.scrollTo(0, 0);
    setShowIntro(false);
  };

  return (
    <>
      {showIntro ? (
        <Intro onFinish={handleLoadingFinish} />
      ) : (
        <div className="relative overflow-x-hidden">
          <MobileHeader backgroundColor="transparent" iconColor={iconColor} />

          {/* 메인 컨텐츠 래퍼 */}
          <main className="relative z-0">
            <HeroSection />
            {/* FeatureSection */}
            <div className="relative z-10">
              <FeatureSection />
            </div>
            {/* VideoSection */}
            <div className="relative z-20">
              <VideoSection setVideoEnded={setVideoEnded} videoEnded={videoEnded} />
            </div>
            {/* StartCTASection */}
            {videoEnded && (
              <div ref={ctaRef} className="relative z-30">
                <StartCTASection />
              </div>
            )}
          </main>

          <CustomCursor />
        </div>
      )}
    </>
  );
};

export default LandingPage;
