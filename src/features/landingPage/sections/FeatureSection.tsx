import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';
import FeatureItem from '../components/FeatureItem';

gsap.registerPlugin(ScrollTrigger);

const FeatureSection = () => {
  const featureSectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const ctx = gsap.context(() => {
      const images = gsap.utils.toArray('.feature-image');
      const numbers = gsap.utils.toArray('.feature-index');
      const titles = gsap.utils.toArray('.feature-title');
      const descs = gsap.utils.toArray('.feature-desc');

      // 이미지 애니메이션
      images.forEach((image, index) => {
        gsap.from(image as HTMLImageElement, {
          opacity: 0,
          scale: 0.7,
          rotationY: index % 2 === 0 ? -180 : 180,
          duration: 8,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: image as HTMLImageElement,
            start: 'top 90%',
            end: 'top 60%',
            scrub: 1.2,
            invalidateOnRefresh: true,
            refreshPriority: -1, // 우선순위 추가
          },
        });
      });

      // 기능 번호 애니메이션
      numbers.forEach((number) => {
        gsap.from(number as HTMLHeadingElement, {
          opacity: 0,
          y: 10,
          duration: 1,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: number as HTMLHeadingElement,
            start: 'top 75%',
            end: 'top 45%',
            scrub: 0.6,
            invalidateOnRefresh: true,
            refreshPriority: -1,
          },
        });
      });

      // 타이틀 애니메이션
      titles.forEach((title) => {
        gsap.from(title as HTMLHeadingElement, {
          opacity: 0,
          y: 20,
          duration: 1,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: title as HTMLHeadingElement,
            start: 'top 80%',
            end: 'top 50%',
            scrub: 0.6,
            invalidateOnRefresh: true,
            refreshPriority: -1,
          },
        });
      });

      // 설명 문구 애니메이션
      descs.forEach((desc) => {
        gsap.from(desc as HTMLParagraphElement, {
          opacity: 0,
          y: 30,
          duration: 1,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: desc as HTMLParagraphElement,
            start: 'top 85%',
            end: 'top 55%',
            scrub: 0.6,
            invalidateOnRefresh: true,
            refreshPriority: -1,
          },
        });
      });
    }, featureSectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={featureSectionRef}
      data-theme="dark"
      className="relative h-[500vh] px-5 py-20 bg-[#000000] flex flex-col justify-center gap-10 max-lg:px-8 overflow-hidden z-10"
    >
      <img
        src="/images/landing/feature/wave.webp"
        alt="물결"
        className="absolute top-0 left-0 w-full h-auto z-10 pointer-events-none"
        loading="lazy"
      />
      <FeatureItem
        number={1}
        imageSrc="/images/landing/feature/feature-1.webp"
        alt="기능설명-1"
        title={
          <>
            내 주변의 모든 멤버십 혜택을 <span className="text-purple04 font-bold">지도</span>{' '}
            위에서 한눈에 확인하세요!
          </>
        }
        description="지도를 통해 주변에 있는 모든 제휴처의 멤버십 혜택을 간편하게 확인할 수 있어요. 원하는 혜택을 빠르게 찾고, 할인 정보와 제휴 내용을 쉽게 비교해보세요."
      />
      <FeatureItem
        number={2}
        reverse
        imageSrc="/images/landing/feature/feature-2.webp"
        alt="기능설명-2"
        title={
          <>
            내가 자주 쓰는 혜택을 <span className="text-purple04 font-bold">AI</span>가 알아서
            분석하고 추천해줘요!
          </>
        }
        description="사용 내역과 관심사를 AI가 분석하여 가장 적합한 혜택을 맞춤 추천해드립니다. 더 이상 어렵게 찾지 말고 나만을 위한 혜택을 빠르게 받아보세요."
      />
      <FeatureItem
        number={3}
        imageSrc="/images/landing/feature/feature-3.webp"
        alt="기능설명-3"
        title={
          <>
            <span className="text-purple04 font-bold">나만의 관심 혜택</span>을 한눈에 모아
            스마트하게 관리하세요!
          </>
        }
        description="관심 있는 제휴처 혜택을 저장하고, 나만의 맞춤 리스트를 만들어 쉽게 관리할 수 있어요. 중요한 혜택을 놓치지 않도록 스마트하고 편리하게 관리해보세요."
      />
      <FeatureItem
        number={4}
        reverse
        imageSrc="/images/landing/feature/feature-4-web.webp"
        alt="기능 설명-4"
        title={
          <>
            간단한 <span className="text-purple04 font-bold">금액 입력</span>만으로 내가 받은 혜택을
            자동으로 정리해드려요.
          </>
        }
        description="간단한 금액 입력만으로 제휴처에서 사용한 내역과 혜택 현황을 쉽게 조회할 수 있어요. 소비 패턴 분석과 맞춤형 혜택 관리까지 한 번에 가능합니다."
      />
    </section>
  );
};

export default FeatureSection;
