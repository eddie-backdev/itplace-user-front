// tailwind.config.js
const tailwindConfig = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Apple SD Gothic Neo', 'Malgun Gothic', 'system-ui', 'sans-serif'],
      },
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
        black: '#191F28',
        white: '#FFFFFF',
        danger: 'rgb(var(--itplace-rgb-danger) / <alpha-value>)',
        success: 'rgb(var(--itplace-rgb-success) / <alpha-value>)',
        successDark: '#115C3A',
        // ITPLACE semantic palette
        brand: '#6154D9',
        brandStrong: '#5145C5',
        brandSoft: 'rgb(var(--itplace-rgb-brand-subtle) / <alpha-value>)',
        accent: 'rgb(var(--itplace-rgb-accent) / <alpha-value>)',
        accentStrong: 'rgb(var(--itplace-rgb-accent-hover) / <alpha-value>)',
        benefit: 'rgb(var(--itplace-rgb-accent) / <alpha-value>)',
        ink: 'rgb(var(--itplace-rgb-text) / <alpha-value>)',
        warmMuted: 'rgb(var(--itplace-rgb-muted) / <alpha-value>)',
        warmCanvas: 'rgb(var(--itplace-rgb-canvas) / <alpha-value>)',
        warmSurface: 'rgb(var(--itplace-rgb-surface) / <alpha-value>)',
        warmBorder: 'rgb(var(--itplace-rgb-border) / <alpha-value>)',
        controlBorder: 'rgb(var(--itplace-rgb-control-border) / <alpha-value>)',
        warmNav: 'rgb(var(--itplace-rgb-surface) / <alpha-value>)',
        softLavender: 'rgb(var(--itplace-rgb-brand-subtle) / <alpha-value>)',
        softMint: 'rgb(var(--itplace-rgb-brand-subtle) / <alpha-value>)',
        softPeach: 'rgb(var(--itplace-rgb-canvas) / <alpha-value>)',
        lavenderInk: 'rgb(var(--itplace-rgb-accent-hover) / <alpha-value>)',
        accentBlue: '#6154D9',
        accentTeal: '#8278E7',
        accentGold: '#6154D9',
        accentGoldDark: '#5145C5',
        accentRose: '#EC4899',
        accentRoseDark: '#BE185D',
        // 기존 class 이름은 점진 마이그레이션을 위한 호환 alias다.
        purple01: 'rgb(var(--itplace-rgb-brand-subtle) / <alpha-value>)',
        purple02: 'rgb(var(--itplace-rgb-brand-border) / <alpha-value>)',
        purple03: '#8278E7',
        purple04: '#6154D9',
        purple05: '#5145C5',
        purple06: '#4035A8',
        orange01: '#FFF8D8',
        orange02: '#FFEBA2',
        orange03: '#FFD75A',
        orange04: '#7A5700',
        orange05: '#5F4300',
        grey01: 'rgb(var(--itplace-rgb-canvas) / <alpha-value>)',
        grey02: 'rgb(var(--itplace-rgb-border) / <alpha-value>)',
        grey03: 'rgb(var(--itplace-rgb-control-border) / <alpha-value>)',
        grey04: 'rgb(var(--itplace-rgb-muted) / <alpha-value>)',
        grey05: 'rgb(var(--itplace-rgb-muted) / <alpha-value>)',
        grey06: 'rgb(var(--itplace-rgb-secondary) / <alpha-value>)',
        grey07: 'rgb(var(--itplace-rgb-text) / <alpha-value>)',
        pink01: '#FFF0F4',
        pink02: '#FFD6E1',
        pink03: '#EF8DA9',
        pink04: '#C74A70',
        pink05: '#9F3152',
      },
      boxShadow: {
        card: '0 2px 10px rgba(31, 38, 52, 0.035)',
      },
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
      wide: '1600px',
      ultrawide: '2200px',
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
};

export default tailwindConfig;
