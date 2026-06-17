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
        black: '#101114',
        white: '#FFFFFF',
        danger: '#D7263D',
        success: '#149E61',
        successDark: '#026B3F',
        // Semantic accents paired with Brand Purple
        accentBlue: '#2F80ED',
        accentTeal: '#14B8A6',
        accentGold: '#F6C343',
        accentGoldDark: '#D98E04',
        accentRose: '#EC4899',
        accentRoseDark: '#BE185D',
        // ITPLACE Brand Purple — Kraken reference values with ITPLACE naming
        purple01: '#EDE7FE', // subtle surface derived from rgba(133, 91, 251, 0.16)
        purple02: '#D8CBFE', // focus ring / soft border
        purple03: '#855BFB', // light brand accent
        purple04: '#7132F5', // primary brand / CTA
        purple05: '#5741D8', // hover / active
        purple06: '#5B1ECF', // deep emphasis
        // Legacy accent aliases. 신규 UI에서는 success*/purple* 사용을 우선한다.
        orange01: '#E7F4EE',
        orange02: '#CBE9DA',
        orange03: '#149E61',
        orange04: '#149E61',
        orange05: '#026B3F',
        // Neutral - Kraken cool gray scale
        grey01: '#F8F8FA',
        grey02: '#DEDEE5',
        grey03: '#C9CBD6',
        grey04: '#9497A9',
        grey05: '#686B82',
        grey06: '#484B5E',
        grey07: '#101114',
        // Legacy pink aliases. 신규 UI에서는 purple* 사용을 우선한다.
        pink01: '#EDE7FE',
        pink02: '#D8CBFE',
        pink03: '#855BFB',
        pink04: '#7132F5',
        pink05: '#5741D8',
      },
      // 그라데이션
      // bg-[지정명]
      backgroundImage: {
        'gradient-header': 'linear-gradient(#7132F5 0%, #7132F5 32%, #5B1ECF 100%)',
        'gradient-myPage': 'linear-gradient(90deg, #855BFB 0%, #7132F5 45%, #5B1ECF 100%)',
      },
      // 드롭 섀도우
      // drop-shadow-[지정명]
      dropShadow: {
        basic: '0px 3px 12px rgba(16, 17, 20, 0.12)',
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
