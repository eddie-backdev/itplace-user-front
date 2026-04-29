// tailwind.config.js
import plugin from 'tailwindcss/plugin';
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      // 폰트 사이즈
      // text-[지정명]
      fontSize: {
        // Title - line-height 130%
        'title-1': ['2.625rem', { lineHeight: '130%', fontWeight: 'bold' }],
        'title-2': ['2rem', { lineHeight: '130%', fontWeight: 'bold' }],
        'title-3': ['1.75rem', { lineHeight: '130%', fontWeight: 'bold' }],
        'title-4': ['1.5rem', { lineHeight: '130%', fontWeight: '500' }],
        'title-5': ['1.25rem', { lineHeight: '130%', fontWeight: '500' }],
        'title-6': ['1.125rem', { lineHeight: '130%', fontWeight: '500' }],
        'title-7': ['1rem', { lineHeight: '130%', fontWeight: '500' }],
        'title-8': ['0.875rem', { lineHeight: '130%', fontWeight: '500' }],
        // Body - line-height 150%
        'body-0': ['1.25rem', { lineHeight: '150%' }],
        'body-1': ['1.125rem', { lineHeight: '150%' }],
        'body-2': ['1rem', { lineHeight: '150%' }],
        'body-3': ['0.875rem', { lineHeight: '150%' }],
        'body-4': ['0.75rem', { lineHeight: '150%' }],
        'body-5': ['0.625rem', { lineHeight: '150%' }],
        // Body - line-height 150% fontWeight 600
        'body-0-bold': ['1.25rem', { lineHeight: '150%', fontWeight: '600' }],
        'body-1-bold': ['1.125rem', { lineHeight: '150%', fontWeight: '600' }],
        'body-2-bold': ['1rem', { lineHeight: '150%', fontWeight: '600' }],
        'body-3-bold': ['0.875rem', { lineHeight: '150%', fontWeight: '600' }],
        'body-4-bold': ['0.75rem', { lineHeight: '150%', fontWeight: '600' }],
        'body-5-bold': ['0.625rem', { lineHeight: '150%', fontWeight: '600' }],
        caption: ['0.75rem', { lineHeight: '140%' }],
        'caption-1': ['0.75rem', { lineHeight: '140%' }],
        'caption-2': ['0.625rem', { lineHeight: '140%' }],
      },
      // 컬러
      // bg-[지정명]
      colors: {
        black: '#17171B',
        white: '#FFFFFF',
        danger: '#DC3545',
        success: '#28A745',
        // Primary Color
        purple01: '#E6DBFF',
        purple02: '#CDB5FF',
        purple03: '#A175FF',
        purple04: '#7638FA', // main
        purple05: '#530CC2', // hover
        purple06: '#250961',
        // Secondary Color - Orange
        orange01: '#FFEEDC',
        orange02: '#FFD4A0',
        orange03: '#FFBD6D',
        orange04: '#FFA023', // main
        orange05: '#F58700',
        // Neutral - Grey
        grey01: '#F5F5F5',
        grey02: '#DDDDDD',
        grey03: '#BCBCBD',
        grey04: '#7A7A7C',
        grey05: '#38383B',
        grey06: '#17171B',
        grey07: '#111827',
        // Pink Color
        pink01: '#FFECEF',
        pink02: '#FFBDC8',
        pink03: '#FF4C91', // main
        pink04: '#FF0069',
        pink05: '#DF005A',
      },
      // 그라데이션
      // bg-[지정명]
      backgroundImage: {
        'gradient-header': 'linear-gradient(#7638FA 0%, #7638FA 32%, #250961 100%)',
        'gradient-myPage': 'linear-gradient(90deg, #FFBD6D 0%, #FF4C91 28%, #7638FA 100%)',
      },
      // 드롭 섀도우
      // drop-shadow-[지정명]
      dropShadow: {
        basic: '0px 3px 12px rgba(0, 0, 0, 0.15)',
      },
    },
    screens: {
      // 기본 테일윈드 breakpoints 유지
      sm: '640px', // 640px 이상
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      // max-width 기반 반대 방향 브레이크포인트 (웹 우선 대응)
      'max-xl': { max: '1536px' }, // 노트북 FHD 125% 배율 대비
      'max-xlg': { max: '1250px' }, // 태블릿 가로 1023px 이하
      'max-lg': { max: '1023px' }, // 태블릿 가로 1023px 이하
      'max-md': { max: '767px' }, // 태블릿 세로
      'max-sm': { max: '500px' }, // 모바일 세로
    },
    keyframes: {
      floating: {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-4px)' }, // 살짝 위로
      },
    },
    animation: {
      floating: 'floating 2s ease-in-out infinite',
    },
  },
  plugins: [
    // 헤더 글래스 모피즘
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.header-glass': {
          boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.15), inset 2px 2px 6px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(35px)',
          WebkitBackdropFilter: 'blur(35px)', // Safari 대응
        },
      });
    }),
  ],
};
