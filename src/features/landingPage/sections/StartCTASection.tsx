import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import Button from '../components/Button';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';

const StartCTASection = () => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const imageRef = useRef<HTMLImageElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const text = textRef.current;
    if (text) {
      gsap.fromTo(
        text,
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1, ease: 'power2.inOut' }
      );
    }

    const button = buttonRef.current;
    if (button) {
      gsap.fromTo(
        button,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1, ease: 'power2.inOut' }
      );
    }

    const image = imageRef.current;
    if (image) {
      gsap.fromTo(
        image,
        { x: '-100%', opacity: 0 },
        {
          x: '0%',
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
          delay: 0.5,
          onComplete: () => {
            gsap.to(image, { y: -20, yoyo: true, repeat: -1, duration: 0.7, ease: 'sine.out' });
          },
        }
      );
    }
  }, []);

  return (
    <section
      data-theme="light"
      className="relative w-full min-h-[100vh] overflow-hidden flex items-center justify-center max-lg:px-6 bg-white"
    >
      <div className="absolute left-[-18%] top-[5%] w-[45%] h-[85%] max-lg:hidden">
        <img
          ref={imageRef}
          src="/images/landing/cta/cta-rabbit.webp"
          alt="CTA토끼"
          loading="lazy"
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>

      <div className="text-center z-10">
        <h1
          ref={textRef}
          className="custom-font text-[200px] text-purple04 drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] tracking-wide max-xl:text-[130px] max-sm:text-[52px]"
        >
          LET’S START
          <br />
          IT PLACE!
        </h1>

        <div
          ref={buttonRef}
          className="mt-10 flex justify-center items-center gap-6 max-md:flex-col"
        >
          {!isLoggedIn && (
            <Button variant="outline" onClick={() => navigate('/login')}>
              로그인하기
            </Button>
          )}
          <Button variant="primary" onClick={() => navigate('/')}>
            잇플레이스로 가기
          </Button>
        </div>
      </div>
    </section>
  );
};

export default StartCTASection;
