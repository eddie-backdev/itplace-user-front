'use client';

import guide from '../content/membership-guide.json';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from '@/lib/navigation';
import { TbArrowRight, TbExternalLink, TbMapPin, TbRefresh, TbSearch } from 'react-icons/tb';
import InfoPageShell from '../components/InfoPageShell';
import PartnerBenefitCard from '../components/PartnerBenefitCard';
import {
  CARRIER_PAGE_CONFIGS,
  getCarrierPageBySlug,
  MEMBERSHIP_INDEX_PAGE,
} from '../config/membershipPages';
import {
  getPartnerBenefits,
  PartnerBenefitItem,
} from '../features/allBenefitsPage/apis/allBenefitsApi';
import { getPartnerBenefitPath } from '../utils/partnerSeo';

const commonChecks = [
  '내 통신사와 멤버십 등급을 먼저 확인합니다.',
  '같은 제휴처라도 통신사별 혜택과 이용 방법을 비교합니다.',
  '결제 전 통신사 공식 안내에서 최신 조건을 다시 확인합니다.',
];

const MembershipLandingPage = ({
  initialPartners,
}: {
  initialPartners?: PartnerBenefitItem[] | null;
}) => {
  const { carrierSlug } = useParams<{ carrierSlug?: string }>();
  const selectedCarrier = getCarrierPageBySlug(carrierSlug);
  const hasInitialPartners = initialPartners !== undefined && initialPartners !== null;
  const [partners, setPartners] = useState<PartnerBenefitItem[]>(initialPartners ?? []);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    hasInitialPartners ? 'ready' : 'loading'
  );
  const hasInitialPartnersRef = useRef(hasInitialPartners);

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
    if (hasInitialPartnersRef.current) {
      hasInitialPartnersRef.current = false;
      return;
    }
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
      ...MEMBERSHIP_INDEX_PAGE,
    };
  }, [selectedCarrier]);

  const benefitQuery = selectedCarrier ? `?carrier=${selectedCarrier.code}` : '';

  return (
    <>
      <InfoPageShell
        eyebrow="IT:PLACE MEMBERSHIP"
        title={page.heading}
        description={page.description}
      >
        <nav
          aria-label="통신사 멤버십 선택"
          className="flex flex-wrap gap-x-8 border-b border-warmBorder"
        >
          {CARRIER_PAGE_CONFIGS.map((carrier) => {
            const isSelected = selectedCarrier?.code === carrier.code;
            return (
              <Link
                key={carrier.code}
                to={`/membership/${carrier.slug}`}
                aria-current={isSelected ? 'page' : undefined}
                className={`min-h-12 border-b-2 px-1 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                  isSelected
                    ? 'border-accent text-accentStrong'
                    : 'border-transparent text-ink hover:border-accent/40'
                }`}
              >
                <span className="block text-[16px] font-semibold">{carrier.name}</span>
                <span className="mt-1 block text-[14px] font-medium text-warmMuted">
                  {carrier.serviceName} 혜택 보기
                </span>
              </Link>
            );
          })}
        </nav>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-accentStrong">인기 제휴처</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-ink sm:text-[22px]">
                {selectedCarrier
                  ? `${selectedCarrier.name}에서 많이 찾는 곳`
                  : '많이 찾는 멤버십 제휴처'}
              </h2>
            </div>
            <Link
              to={`/benefits${benefitQuery}`}
              className="inline-flex min-h-11 items-center font-semibold text-accentStrong hover:text-accent"
            >
              전체 보기
            </Link>
          </div>

          {status === 'loading' ? (
            <div
              className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
              aria-label="제휴처 로딩 중"
            >
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="h-48 animate-pulse rounded-[20px] border border-warmBorder bg-warmSurface motion-reduce:animate-none"
                />
              ))}
            </div>
          ) : null}

          {status === 'error' ? (
            <button
              type="button"
              onClick={() => void loadPartners()}
              className="surface-card mt-5 flex min-h-12 w-full items-center justify-center gap-2 px-5 py-4 font-semibold text-accentStrong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <TbRefresh className="h-5 w-5" aria-hidden="true" />
              제휴처를 불러오지 못했어요. 다시 시도
            </button>
          ) : null}

          {status === 'ready' ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2 wide:grid-cols-3 ultrawide:grid-cols-4">
              {partners.map((partner) => (
                <PartnerBenefitCard
                  key={partner.partnerId}
                  partner={partner}
                  carrier={selectedCarrier?.code}
                  href={`${getPartnerBenefitPath(partner.partnerId, partner.partnerName)}${benefitQuery}`}
                />
              ))}
            </div>
          ) : null}
        </section>

        <section aria-labelledby="membership-reading-guide">
          <h2
            id="membership-reading-guide"
            className="text-balance text-xl font-semibold tracking-[-0.02em] text-ink sm:text-[22px]"
          >
            {selectedCarrier
              ? `${selectedCarrier.serviceName}, 이렇게 읽으세요`
              : '통신사마다 먼저 확인할 조건이 다릅니다'}
          </h2>
          <div
            className={`mt-4 grid gap-5 divide-y divide-warmBorder border-y border-warmBorder py-5 ${selectedCarrier ? 'md:grid-cols-2' : 'lg:grid-cols-3'}`}
          >
            {(selectedCarrier ? [selectedCarrier] : CARRIER_PAGE_CONFIGS).map((carrier) => (
              <div
                key={carrier.code}
                className={selectedCarrier ? 'contents' : 'border-t border-warmBorder pt-4'}
              >
                {!selectedCarrier ? (
                  <h3 className="text-base font-semibold text-accentStrong">{carrier.name}</h3>
                ) : null}
                {carrier.learningPoints.map((point) => (
                  <div
                    key={point.title}
                    className={selectedCarrier ? 'border-l-2 border-accent pl-5' : 'mt-4'}
                  >
                    {selectedCarrier ? (
                      <h3 className="font-semibold leading-6 text-ink">{point.title}</h3>
                    ) : (
                      <h4 className="font-semibold leading-6 text-ink">{point.title}</h4>
                    )}
                    <p className="mt-3 max-w-[65ch] text-sm leading-7 text-grey06">{point.body}</p>
                  </div>
                ))}
                {!selectedCarrier ? (
                  <Link
                    to={`/membership/${carrier.slug}`}
                    className="mt-4 inline-flex min-h-11 items-center rounded-md font-semibold text-accentStrong underline underline-offset-4 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    {carrier.name} 조건과 공식 출처 보기
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
          {selectedCarrier ? (
            <div className="mt-5 border-t border-warmBorder pt-4 text-sm leading-6 text-grey05">
              <p>
                위 해설의 공식 안내 확인일{' '}
                <time dateTime={selectedCarrier.checkedAt}>{selectedCarrier.checkedAt}</time>
              </p>
              <div className="mt-1 flex flex-wrap gap-x-5">
                {[
                  { label: selectedCarrier.sourceLabel, url: selectedCarrier.sourceUrl },
                  ...(selectedCarrier.additionalSources ?? []),
                ].map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-1 rounded-md font-bold text-accentStrong underline underline-offset-4 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    {source.label}
                    <TbExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="border-t border-warmBorder py-6">
            <p className="text-[14px] font-semibold text-accentStrong">
              이 페이지에서 확인할 수 있어요
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-ink sm:text-[22px]">
              {selectedCarrier
                ? `${selectedCarrier.name} 제휴처와 혜택 조건`
                : '통신 3사 혜택을 같은 기준으로 비교'}
            </h2>
            <ul className="mt-5 space-y-3 text-body-3 leading-6 text-grey06">
              {(selectedCarrier?.checks ?? commonChecks).map((check) => (
                <li key={check} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span>{check}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-warmBorder py-6">
            <p className="text-[14px] font-semibold text-warmMuted">빠르게 찾기</p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-ink">
              원하는 방식으로 혜택을 탐색하세요
            </h2>
            <div className="mt-5 grid gap-3">
              <Link
                to={`/benefits${benefitQuery}`}
                className="flex min-h-12 items-center justify-between border-y border-warmBorder py-3 font-semibold text-accentStrong transition-colors hover:bg-brandStrong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                <span className="flex items-center gap-2">
                  <TbSearch className="h-5 w-5" aria-hidden="true" />
                  전체 제휴처 검색
                </span>
                <TbArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                to="/map"
                className="flex min-h-12 items-center justify-between border-b border-warmBorder py-3 font-semibold text-ink transition-colors hover:border-accent/40 hover:bg-warmCanvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
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

        <section className="border-t border-warmBorder py-6">
          <h2 className="text-xl font-semibold text-ink">실제 결제액으로 혜택 비교하기</h2>
          <p className="mt-3 max-w-[70ch] text-[15px] leading-7 text-grey06">
            {guide.steps.find((step) => step.id === 'discount-vs-points')?.body}
          </p>
          <Link
            to="/guide"
            className="mt-4 inline-flex min-h-11 items-center font-semibold text-accentStrong underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            적용 조건과 이용 실패 사례 확인
          </Link>
        </section>

        <section className="border-t border-warmBorder py-6">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink">
            혜택 정보는 결제 전에 한 번 더 확인해 주세요
          </h2>
          <p className="mt-3 max-w-[80ch] text-[15px] leading-7 text-grey06">
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
