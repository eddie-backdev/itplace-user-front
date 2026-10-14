import type { CarrierCode } from '@/utils/membership';

export type CarrierPageSlug = 'skt' | 'kt' | 'lguplus';

export type CarrierPageConfig = {
  code: CarrierCode;
  slug: CarrierPageSlug;
  name: string;
  serviceName: string;
  summary: string;
  checks: string[];
  learningPoints: { title: string; body: string }[];
  sourceLabel: string;
  sourceUrl: string;
  additionalSources?: { label: string; url: string }[];
  checkedAt: string;
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
      '내 등급뿐 아니라 할인형·적립형과 실제 제공 혜택 확인',
      '바코드 제시·통신사 앱 예매 등 브랜드별 이용 경로 확인',
      'VIP PICK 사용 여부와 제휴처별 남은 이용 횟수 확인',
    ],
    learningPoints: [
      {
        title: '적립형이라고 모든 혜택이 적립은 아닙니다',
        body: 'T 멤버십은 할인·적립·포인트 사용을 구분합니다. GS25 화요일 혜택처럼 두 유형 모두 할인인 경우도 있으므로, 유형 이름 다음에 적힌 실제 보상을 읽으세요. 적립 포인트는 지금 낼 결제액과 따로 비교합니다.',
      },
      {
        title: 'VIP PICK은 이번 달 계획과 함께 고릅니다',
        body: 'CGV 안내는 다른 VIP PICK을 이용한 달에는 영화 VIP PICK을 사용할 수 없다고 설명합니다. 영화만 따로 계산하기보다 이번 달 이용할 다른 제휴처와 함께 비교하고, 일반 할인과 VIP PICK을 구분하세요.',
      },
    ],
    sourceLabel: 'T 멤버십 혜택 브랜드 공식 안내',
    sourceUrl: 'https://sktmembership.tworld.co.kr/mps/pc-bff/benefitbrand/list-tab1.do',
    additionalSources: [
      {
        label: 'SKT GS25 안내',
        url: 'https://sktmembership.tworld.co.kr/mps/pc-bff/benefitbrand/detail.do?brandId=5321',
      },
      {
        label: 'SKT CGV 안내',
        url: 'https://sktmembership.tworld.co.kr/mps/pc-bff/benefitbrand/detail.do?brandId=973',
      },
    ],
    checkedAt: '2026-10-03',
  },
  {
    code: 'KT',
    slug: 'kt',
    name: 'KT',
    serviceName: 'KT 멤버십',
    summary:
      'KT 멤버십 제휴처를 브랜드와 카테고리별로 살펴보고, 등급별 혜택과 이용 횟수·한도를 한곳에서 비교합니다.',
    checks: [
      '내 등급으로 제공되는 일반 혜택과 VVIP·VIP 초이스 구분',
      '연간 포인트 한도와 별개인 제휴처별 횟수·대상 조건 확인',
      '영화는 상영일이 아닌 예매일 기준으로 사용 월 확인',
    ],
    learningPoints: [
      {
        title: '포인트 한도와 이용 횟수는 다릅니다',
        body: 'KT 공식 안내는 2025년 5월 8일부터 연간 할인한도(포인트) 없이 제휴처별 조건에 따라 이용한다고 설명합니다. 연간 한도가 없다는 것이 모든 혜택을 횟수 제한 없이 쓸 수 있다는 뜻은 아닙니다.',
      },
      {
        title: '영화는 예매하는 달을 먼저 확인합니다',
        body: 'KT 영화예매는 예매일 기준으로 혜택을 적용합니다. 다음 달 영화를 월말에 예약하면 이번 달 혜택을 씁니다. VVIP·VIP 초이스는 다른 초이스 이용 여부도 확인한 뒤 선택하세요.',
      },
    ],
    sourceLabel: 'KT 멤버십 등급·이용 조건 공식 안내',
    sourceUrl: 'https://globalshop.kt.com/global/membership.do',
    additionalSources: [
      { label: 'KT 영화예매 안내', url: 'https://showmovie.mobile.kt.com/default.aspx' },
    ],
    checkedAt: '2026-10-03',
  },
  {
    code: 'LGU',
    slug: 'lguplus',
    name: 'LG U+',
    serviceName: 'U+ 멤버십',
    summary:
      'LG U+ 멤버십 제휴처를 브랜드와 카테고리별로 살펴보고, 우수·VIP·VVIP 등급별 혜택과 이용 조건을 비교합니다.',
    checks: [
      '내 등급으로 받을 수 있는 제휴 할인과 VIP콕 구분',
      'VIP콕을 다른 혜택에 이미 사용했는지 확인',
      '기간 이벤트의 쿠폰 발급일·사용 기한·제외 조건 확인',
    ],
    learningPoints: [
      {
        title: 'VIP콕은 다른 선택과 함께 비교합니다',
        body: 'U+ 공식 소개는 영화 예매도 VIP콕 중 하나이며 다른 VIP콕과 중복 사용할 수 없다고 안내합니다. 영화·음료 등 이번 달 실제로 이용할 혜택을 비교한 뒤 선택하세요. 브랜드별 세부 제공 조건은 별도로 확인합니다.',
      },
      {
        title: '유플투쁠 쿠폰과 상시 혜택을 구분합니다',
        body: '유플투쁠은 특정일에 제공하는 쿠폰이며 월별 혜택이 달라질 수 있습니다. 지난달 행사 글에 있는 브랜드·금액을 이번 달에도 받을 수 있다고 가정하지 말고 발급 일정과 사용 기한을 확인하세요.',
      },
    ],
    sourceLabel: 'U+ 멤버십 소개 공식 안내',
    sourceUrl: 'https://m.lguplus.com/membership/intro',
    checkedAt: '2026-10-03',
  },
];

export const getCarrierPageBySlug = (slug?: string) =>
  CARRIER_PAGE_CONFIGS.find((carrier) => carrier.slug === slug) ?? null;
