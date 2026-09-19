import type { CarrierCode } from '@/utils/membership';

export type CarrierPageSlug = 'skt' | 'kt' | 'lguplus';

export type CarrierPageConfig = {
  code: CarrierCode;
  slug: CarrierPageSlug;
  name: string;
  serviceName: string;
  summary: string;
  checks: string[];
};

export const MEMBERSHIP_INDEX_PAGE = {
  title: '통신 3사 멤버십 혜택 비교 | 잇플레이스',
  heading: '통신사 멤버십 혜택',
  description:
    'SKT, KT, LG U+ 통신 3사 멤버십 제휴처를 한곳에서 찾고 통신사별 할인, 등급, 이용 조건을 비교합니다.',
  path: '/membership',
} as const;

export const CARRIER_PAGE_CONFIGS: CarrierPageConfig[] = [
  {
    code: 'SKT',
    slug: 'skt',
    name: 'SKT',
    serviceName: 'T 멤버십',
    summary:
      'SKT T 멤버십 제휴처를 브랜드와 카테고리별로 살펴보고, 등급별 할인·적립 조건과 이용 채널을 한곳에서 비교합니다.',
    checks: [
      '제휴처별 적용 등급과 할인·적립 조건',
      '온라인 주문과 오프라인 매장 이용 가능 여부',
      '월별 이용 횟수와 한도 등 제한 조건',
    ],
  },
  {
    code: 'KT',
    slug: 'kt',
    name: 'KT',
    serviceName: 'KT 멤버십',
    summary:
      'KT 멤버십 제휴처를 브랜드와 카테고리별로 살펴보고, 등급별 혜택과 이용 횟수·한도를 한곳에서 비교합니다.',
    checks: [
      '일반부터 VVIP까지 적용되는 멤버십 등급',
      '제휴처별 할인 내용과 포인트 사용 조건',
      '현장 결제·온라인 이용 방법과 이용 제한',
    ],
  },
  {
    code: 'LGU',
    slug: 'lguplus',
    name: 'LG U+',
    serviceName: 'U+ 멤버십',
    summary:
      'LG U+ 멤버십 제휴처를 브랜드와 카테고리별로 살펴보고, 우수·VIP·VVIP 등급별 혜택과 이용 조건을 비교합니다.',
    checks: [
      '우수·VIP·VVIP 등급별 제공 조건',
      '제휴처별 할인과 라이프스타일 혜택',
      '앱 인증, 현장 결제 등 실제 이용 방법',
    ],
  },
];

export const getCarrierPageBySlug = (slug?: string) =>
  CARRIER_PAGE_CONFIGS.find((carrier) => carrier.slug === slug) ?? null;
