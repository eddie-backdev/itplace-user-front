import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TbGift, TbMapPin, TbStar } from 'react-icons/tb';
import SafeImage from '../components/SafeImage';
import {
  getPartnerBenefits,
  PartnerBenefitItem,
  PartnerBenefitApiParams,
} from '../features/allBenefitsPage/apis/allBenefitsApi';
import { CARRIER_OPTIONS, CarrierCode, getCarrierLabel } from '../utils/membership';
import { getPartnerBenefitPath } from '../utils/partnerSeo';

const MobileHomePage = () => {
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierCode | 'ALL'>('ALL');
  const [popularPartners, setPopularPartners] = useState<PartnerBenefitItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const loadPopularPartners = useCallback(async () => {
    setStatus('loading');
    try {
      const params: PartnerBenefitApiParams = {
        mainCategory: 'BASIC_BENEFIT',
        page: 0,
        size: 8,
        sort: 'POPULARITY',
      };

      if (selectedCarrier !== 'ALL') {
        params.carriers = [selectedCarrier];
      }

      const data = await getPartnerBenefits(params);
      setPopularPartners(data.content ?? []);
      setStatus('ready');
    } catch {
      setPopularPartners([]);
      setStatus('error');
    }
  }, [selectedCarrier]);

  useEffect(() => {
    void loadPopularPartners();
  }, [loadPopularPartners]);

  return (
    <div className="min-h-screen bg-purple01/60 px-5 pb-[96px] pt-[calc(env(safe-area-inset-top)+18px)] text-black">
      <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_42px_rgba(113,50,245,0.10)]">
        <p className="text-body-4 font-bold text-purple04">IT:PLACE BENEFIT</p>
        <h1 className="mt-2 text-[26px] font-extrabold leading-[1.22] text-grey06">
          내 통신사 멤버십 혜택을 먼저 확인해요
        </h1>
        <p className="mt-3 text-body-3 leading-6 text-grey04">
          통신사별 인기 혜택과 주변 제휴처를 앱처럼 빠르게 탐색할 수 있어요.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            to="/benefits"
            className="rounded-[18px] bg-purple04 px-4 py-3 text-left text-white shadow-[0_10px_22px_rgba(113,50,245,0.24)] active:scale-[0.98]"
          >
            <TbGift className="mb-2 h-6 w-6" aria-hidden="true" />
            <span className="block text-body-3 font-bold">전체 혜택 보기</span>
          </Link>
          <Link
            to="/map"
            className="rounded-[18px] border border-purple02 bg-purple01 px-4 py-3 text-left text-purple05 active:scale-[0.98]"
          >
            <TbMapPin className="mb-2 h-6 w-6" aria-hidden="true" />
            <span className="block text-body-3 font-bold">지도에서 찾기</span>
          </Link>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-body-4 font-bold text-purple04">통신사별 인기 혜택</p>
            <h2 className="mt-1 text-title-5 font-bold text-grey06">많이 찾는 혜택</h2>
          </div>
          <Link to="/benefits" className="text-body-4 font-bold text-purple04">
            전체보기
          </Link>
        </div>

        <div className="scrollbar-hide -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          <button
            type="button"
            onClick={() => setSelectedCarrier('ALL')}
            className={`shrink-0 rounded-full border px-4 py-2 text-body-4 font-bold ${
              selectedCarrier === 'ALL'
                ? 'border-purple04 bg-purple04 text-white'
                : 'border-grey02 bg-white text-grey04'
            }`}
          >
            전체
          </button>
          {CARRIER_OPTIONS.map((carrier) => (
            <button
              key={carrier.code}
              type="button"
              onClick={() => setSelectedCarrier(carrier.code)}
              className={`shrink-0 rounded-full border px-4 py-2 text-body-4 font-bold ${
                selectedCarrier === carrier.code
                  ? 'border-purple04 bg-purple04 text-white'
                  : 'border-grey02 bg-white text-grey04'
              }`}
            >
              {carrier.label}
            </button>
          ))}
        </div>

        {status === 'loading' ? (
          <div className="mt-4 rounded-[22px] bg-white p-5 text-body-3 text-grey04">
            혜택을 불러오는 중이에요.
          </div>
        ) : null}
        {status === 'error' ? (
          <button
            type="button"
            onClick={() => void loadPopularPartners()}
            className="mt-4 w-full rounded-[22px] bg-white p-5 text-left text-body-3 font-bold text-purple04"
          >
            혜택을 불러오지 못했어요. 다시 시도
          </button>
        ) : null}
        {status === 'ready' && popularPartners.length === 0 ? (
          <div className="mt-4 rounded-[22px] bg-white p-5 text-body-3 text-grey04">
            표시할 혜택이 없어요.
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {popularPartners.map((partner, index) => (
            <Link
              key={partner.partnerId}
              to={getPartnerBenefitPath(partner.partnerId, partner.partnerName)}
              aria-label={`${partner.partnerName} 혜택 상세 보기`}
              className="flex w-full items-center gap-3 rounded-[22px] bg-white p-4 text-left shadow-[0_10px_26px_rgba(16,17,20,0.06)] active:scale-[0.99]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple01 text-body-4 font-extrabold text-purple05">
                {index + 1}
              </span>
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-grey01 p-2">
                <SafeImage
                  src={partner.image}
                  alt={`${partner.partnerName} 로고`}
                  fallbackLabel={partner.partnerName}
                  className="h-full w-full object-contain text-body-4"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-body-2 font-bold leading-5 text-grey06">
                  {partner.partnerName}
                </span>
                <span className="mt-1 line-clamp-1 text-body-4 text-grey04">
                  {partner.carriers.map(getCarrierLabel).join(' · ') || '통신사 정보 없음'} ·{' '}
                  {partner.category || '카테고리 미분류'}
                </span>
                <span className="mt-1 line-clamp-1 text-body-5 text-grey04">
                  통신사별 상세 혜택과 이용 조건 확인
                </span>
              </span>
              <TbStar className="h-5 w-5 shrink-0 text-orange03" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MobileHomePage;
