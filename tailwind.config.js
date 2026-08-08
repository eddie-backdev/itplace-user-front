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
        black: '#242321',
        white: '#FFFEFB',
        danger: '#D7263D',
        success: '#167A4C',
        successDark: '#115C3A',
        // ITPLACE semantic palette
        brand: '#167A4C',
        brandStrong: '#115C3A',
        brandSoft: '#EDF8F2',
        benefit: '#FFD75A',
        ink: '#242321',
        warmMuted: '#6F6A60',
        warmCanvas: '#F9F8F5',
        warmSurface: '#FFFEFB',
        warmBorder: '#E4E1D8',
        warmNav: '#F3F0E8',
        accentBlue: '#33856A',
        accentTeal: '#42A77B',
        accentGold: '#FFD75A',
        accentGoldDark: '#7A5700',
        accentRose: '#EC4899',
        accentRoseDark: '#BE185D',
        // 기존 class 이름은 점진 마이그레이션을 위한 호환 alias다.
        purple01: '#EDF8F2',
        purple02: '#C9E7D7',
        purple03: '#39A66F',
        purple04: '#167A4C',
        purple05: '#115C3A',
        purple06: '#0B452B',
        orange01: '#FFF8D8',
        orange02: '#FFEBA2',
        orange03: '#FFD75A',
        orange04: '#7A5700',
        orange05: '#5F4300',
        grey01: '#F9F8F5',
        grey02: '#E4E1D8',
        grey03: '#D3CFC4',
        grey04: '#757064',
        grey05: '#5F5B52',
        grey06: '#3D3A34',
        grey07: '#242321',
        pink01: '#FFF0F4',
        pink02: '#FFD6E1',
        pink03: '#EF8DA9',
        pink04: '#C74A70',
        pink05: '#9F3152',
      },
      // 그라데이션
      // bg-[지정명]
      backgroundImage: {
        'gradient-header': 'linear-gradient(#167A4C 0%, #167A4C 32%, #0B452B 100%)',
        'gradient-myPage': 'linear-gradient(90deg, #39A66F 0%, #167A4C 45%, #0B452B 100%)',
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
