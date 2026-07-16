import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TbArrowRight, TbMapPin, TbRefresh, TbSearch } from 'react-icons/tb';
import InfoPageShell from '../components/InfoPageShell';
import PageSeo from '../components/PageSeo';
import SafeImage from '../components/SafeImage';
import {
  getPartnerBenefits,
  PartnerBenefitItem,
} from '../features/allBenefitsPage/apis/allBenefitsApi';
import { CarrierCode, getCarrierLabel } from '../utils/membership';
import { getPartnerBenefitPath } from '../utils/partnerSeo';

type CarrierPageConfig = {
  code: CarrierCode;
  slug: 'skt' | 'kt' | 'lguplus';
  name: string;
  serviceName: string;
  summary: string;
  checks: string[];
};

const carrierPages: CarrierPageConfig[] = [
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

const commonChecks = [
  '내 통신사와 멤버십 등급을 먼저 확인합니다.',
  '같은 제휴처라도 통신사별 혜택과 이용 방법을 비교합니다.',
  '결제 전 통신사 공식 안내에서 최신 조건을 다시 확인합니다.',
];

const MembershipLandingPage = () => {
  const { carrierSlug } = useParams<{ carrierSlug?: string }>();
  const selectedCarrier = carrierPages.find((carrier) => carrier.slug === carrierSlug) ?? null;
  const [partners, setPartners] = useState<PartnerBenefitItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const loadPartners = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await getPartnerBenefits({
        mainCategory: 'BASIC_BENEFIT',
        page: 0,
        size: selectedCarrier ? 8 : 12,
        sort: 'POPULARITY',
        ...(selectedCarrier ? { carriers: [selectedCarrier.code] } : {}),
      });
      setPartners(data.content);
      setStatus('ready');
    } catch {
      setPartners([]);
      setStatus('error');
    }
  }, [selectedCarrier]);

  useEffect(() => {
    void loadPartners();
  }, [loadPartners]);

  const page = useMemo(() => {
    if (selectedCarrier) {
      return {
        title: `${selectedCarrier.name} 멤버십 혜택·제휴처 | 잇플레이스`,
        heading: `${selectedCarrier.name} 멤버십 혜택`,
        description: selectedCarrier.summary,
        path: `/membership/${selectedCarrier.slug}`,
      };
    }
    return {
      title: '통신 3사 멤버십 혜택 비교 | 잇플레이스',
      heading: '통신사 멤버십 혜택',
      description:
        'SKT, KT, LG U+ 통신 3사 멤버십 제휴처를 한곳에서 찾고 통신사별 할인, 등급, 이용 조건을 비교합니다.',
      path: '/membership',
    };
  }, [selectedCarrier]);

  const structuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: page.heading,
      description: page.description,
      url: `https://itplace.click${page.path}`,
      isPartOf: { '@id': 'https://itplace.click/#website' },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: '홈',
            item: 'https://itplace.click/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: selectedCarrier ? '통신사 멤버십' : page.heading,
            item: 'https://itplace.click/membership',
          },
          ...(selectedCarrier
            ? [
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: page.heading,
                  item: `https://itplace.click${page.path}`,
                },
              ]
            : []),
        ],
      },
    }),
    [page, selectedCarrier]
  );

  const benefitQuery = selectedCarrier ? `?carrier=${selectedCarrier.code}` : '';

  return (
    <>
      <PageSeo
        title={page.title}
        description={page.description}
        path={page.path}
        structuredData={structuredData}
      />
      <InfoPageShell
        eyebrow="IT:PLACE MEMBERSHIP"
        title={page.heading}
        description={page.description}
      >
        <nav aria-label="통신사 멤버십 선택" className="grid gap-3 sm:grid-cols-3">
          {carrierPages.map((carrier) => {
            const isSelected = selectedCarrier?.code === carrier.code;
            return (
              <Link
                key={carrier.code}
                to={`/membership/${carrier.slug}`}
                aria-current={isSelected ? 'page' : undefined}
                className={`rounded-2xl border p-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 ${
                  isSelected
                    ? 'border-purple03 bg-purple01 text-purple06'
                    : 'border-grey02 bg-white text-grey06 hover:-translate-y-0.5 hover:border-purple02'
                }`}
              >
                <span className="block text-title-7 font-black">{carrier.name}</span>
                <span className="mt-1 block text-body-4 font-medium text-grey05">
                  {carrier.serviceName} 혜택 보기
                </span>
              </Link>
            );
          })}
        </nav>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl bg-purple01/65 p-6 md:p-7">
            <p className="text-sm font-bold text-purple05">이 페이지에서 확인할 수 있어요</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-grey07">
              {selectedCarrier
                ? `${selectedCarrier.name} 제휴처와 혜택 조건`
                : '통신 3사 혜택을 같은 기준으로 비교'}
            </h2>
            <ul className="mt-5 space-y-3 text-body-3 leading-6 text-grey06">
              {(selectedCarrier?.checks ?? commonChecks).map((check) => (
                <li key={check} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple04" />
                  <span>{check}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-grey02 bg-white p-6 md:p-7">
            <p className="text-sm font-bold text-grey05">빠르게 찾기</p>
            <h2 className="mt-2 text-xl font-black tracking-[-0.02em] text-grey07">
              원하는 방식으로 혜택을 탐색하세요
            </h2>
            <div className="mt-5 grid gap-3">
              <Link
                to={`/benefits${benefitQuery}`}
                className="flex items-center justify-between rounded-2xl bg-purple05 px-5 py-4 font-bold text-white transition hover:bg-purple06 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
              >
                <span className="flex items-center gap-2">
                  <TbSearch className="h-5 w-5" aria-hidden="true" />
                  전체 제휴처 검색
                </span>
                <TbArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                to="/map"
                className="flex items-center justify-between rounded-2xl border border-purple02 bg-white px-5 py-4 font-bold text-purple06 transition hover:bg-purple01 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
              >
                <span className="flex items-center gap-2">
                  <TbMapPin className="h-5 w-5" aria-hidden="true" />
                  지도에서 주변 혜택 찾기
                </span>
                <TbArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-purple04">인기 제휴처</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-grey07">
                {selectedCarrier
                  ? `${selectedCarrier.name}에서 많이 찾는 곳`
                  : '많이 찾는 멤버십 제휴처'}
              </h2>
            </div>
            <Link to={`/benefits${benefitQuery}`} className="font-bold text-purple05">
              전체 보기
            </Link>
          </div>

          {status === 'loading' ? (
            <div
              className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
              aria-label="제휴처 로딩 중"
            >
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl bg-grey01" />
              ))}
            </div>
          ) : null}

          {status === 'error' ? (
            <button
              type="button"
              onClick={() => void loadPartners()}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-grey02 px-5 py-5 font-bold text-purple05"
            >
              <TbRefresh className="h-5 w-5" aria-hidden="true" />
              제휴처를 불러오지 못했어요. 다시 시도
            </button>
          ) : null}

          {status === 'ready' ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {partners.map((partner) => (
                <Link
                  key={partner.partnerId}
                  to={getPartnerBenefitPath(partner.partnerId, partner.partnerName)}
                  className="group flex min-w-0 items-center gap-3 rounded-2xl border border-grey02 bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-purple02 hover:shadow-[0_10px_24px_rgba(113,50,245,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-grey01 p-2">
                    <SafeImage
                      src={partner.image}
                      alt={`${partner.partnerName} 로고`}
                      fallbackLabel={partner.partnerName}
                      className="h-full w-full object-contain"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-grey07 group-hover:text-purple05">
                      {partner.partnerName}
                    </span>
                    <span className="mt-1 block truncate text-body-4 text-grey05">
                      {partner.carriers.map(getCarrierLabel).join(' · ')}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-grey02 p-6">
          <h2 className="text-xl font-black tracking-[-0.02em] text-grey07">
            혜택 정보는 결제 전에 한 번 더 확인해 주세요
          </h2>
          <p className="mt-3 leading-7 text-grey06">
            통신사 멤버십 혜택은 기간, 멤버십 등급, 월별 한도, 매장 운영 정책에 따라 바뀔 수
            있습니다. 잇플레이스에서 제휴처와 조건을 비교한 뒤 실제 이용 시점에는 연결된 통신사 공식
            혜택 페이지의 최신 안내를 확인하는 것이 안전합니다.
          </p>
        </section>
      </InfoPageShell>
    </>
  );
};

export default MembershipLandingPage;
