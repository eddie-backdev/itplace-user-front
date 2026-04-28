import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

export const AuthTransition = () => {
  const navigate = useNavigate();
  const formCardRef = useRef<HTMLDivElement>(null);
  const sideCardRef = useRef<HTMLDivElement>(null);

  const [formStep, setFormStep] = useState<
    'login' | 'signUp' | 'signUpFinal' | 'findPassword' | 'oauthIntegration'
  >('login');

  const getDistance = () => {
    if (window.innerWidth <= 1023) {
      return 307;
    } else if (window.innerWidth <= 1536) {
      return 409;
    }
    return 481;
  };

  useEffect(() => {
    gsap.set(formCardRef.current, { x: 0 });
    gsap.set(sideCardRef.current, { x: 0 });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (formStep !== 'login') {
        const newDistance = getDistance();
        gsap.set(formCardRef.current, { x: newDistance });
        gsap.set(sideCardRef.current, { x: -newDistance });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [formStep]);

  const animateToRight = (targetStep: typeof formStep) => {
    const distance = getDistance();
    const tl = gsap.timeline();

    tl.to(formCardRef.current, {
      x: distance,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => {
        const x = gsap.getProperty(formCardRef.current, 'x') as number;
        if (x > distance / 2 && formStep !== targetStep) {
          setFormStep(targetStep);
        }
      },
    });

    tl.to(
      sideCardRef.current,
      {
        x: -distance,
        duration: 0.5,
        ease: 'power2.out',
      },
      '<'
    );
  };

  const goToLogin = () => {
    navigate('/login', { replace: true });

    const distance = getDistance();
    const tl = gsap.timeline();

    tl.to(formCardRef.current, {
      x: 0,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => {
        const x = gsap.getProperty(formCardRef.current, 'x') as number;
        if (x < distance / 2 && formStep !== 'login') {
          setFormStep('login');
        }
      },
    });

    tl.to(
      sideCardRef.current,
      {
        x: 0,
        duration: 0.5,
        ease: 'power2.out',
      },
      '<'
    );
  };

  const goToSignUp = () => animateToRight('signUp');
  const goToSignUpFinal = () => setFormStep('signUpFinal');
  const goToFindPassword = () => animateToRight('findPassword');

  return {
    formStep,
    setFormStep,
    formCardRef,
    sideCardRef,
    goToLogin,
    goToSignUp,
    goToSignUpFinal,
    goToFindPassword,
  };
};
