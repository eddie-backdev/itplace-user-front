import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TbGift, TbMapPin, TbSparkles, TbStar } from 'react-icons/tb';
import SafeImage from '../components/SafeImage';
import {
  getBenefits,
  BenefitItem,
  BenefitApiParams,
} from '../features/allBenefitsPage/apis/allBenefitsApi';
import { CARRIER_OPTIONS, CarrierCode, getCarrierLabel } from '../utils/membership';

const getBenefitDescription = (benefit: BenefitItem) =>
  benefit.tierBenefits?.[0]?.context || '상세 혜택 조건은 카드에서 확인해보세요.';

const MobileHomePage = () => {
  const navigate = useNavigate();
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierCode | 'ALL'>('ALL');
  const [popularBenefits, setPopularBenefits] = useState<BenefitItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const loadPopularBenefits = useCallback(async () => {
    setStatus('loading');
    try {
      const params: BenefitApiParams = {
        mainCategory: 'BASIC_BENEFIT',
        page: 0,
        size: 8,
        sort: 'POPULARITY',
      };

      if (selectedCarrier !== 'ALL') {
        params.carriers = [selectedCarrier];
      }

      const data = await getBenefits(params);
      setPopularBenefits(data.content ?? []);
      setStatus('ready');
    } catch {
      setPopularBenefits([]);
      setStatus('error');
    }
  }, [selectedCarrier]);

  useEffect(() => {
    void loadPopularBenefits();
  }, [loadPopularBenefits]);

  return (
    <div className="min-h-screen bg-[#f5f3ff] px-5 pb-[96px] pt-[calc(env(safe-area-inset-top)+18px)] text-black">
      <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_42px_rgba(83,12,194,0.10)]">
        <p className="text-body-4 font-bold text-purple04">IT:PLACE BENEFIT</p>
        <h1 className="mt-2 text-[26px] font-extrabold leading-[1.22] text-grey06">
          오늘 쓸 수 있는 혜택을 먼저 확인해요
        </h1>
        <p className="mt-3 text-body-3 leading-6 text-grey04">
          통신사별 인기 혜택과 주변 제휴처를 앱처럼 빠르게 탐색할 수 있어요.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate('/benefits')}
            className="rounded-[18px] bg-purple04 px-4 py-3 text-left text-white shadow-[0_10px_22px_rgba(118,56,250,0.24)] active:scale-[0.98]"
          >
            <TbGift className="mb-2 h-6 w-6" aria-hidden="true" />
            <span className="block text-body-3 font-bold">전체 혜택 보기</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/map')}
            className="rounded-[18px] border border-purple02 bg-purple01 px-4 py-3 text-left text-purple05 active:scale-[0.98]"
          >
            <TbMapPin className="mb-2 h-6 w-6" aria-hidden="true" />
            <span className="block text-body-3 font-bold">지도에서 찾기</span>
          </button>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => navigate('/benefits')}
          className="rounded-[22px] bg-white p-4 text-left shadow-[0_10px_28px_rgba(23,17,47,0.06)] active:scale-[0.98]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-orange01 text-[20px]">
            🎁
          </span>
          <span className="mt-3 block text-body-2 font-bold text-grey06">인기 혜택</span>
          <span className="mt-1 block text-body-4 text-grey04">지금 많이 보는 혜택</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/map')}
          className="rounded-[22px] bg-white p-4 text-left shadow-[0_10px_28px_rgba(23,17,47,0.06)] active:scale-[0.98]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-purple01 text-purple05">
            <TbSparkles className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="mt-3 block text-body-2 font-bold text-grey06">주변 탐색</span>
          <span className="mt-1 block text-body-4 text-grey04">내 위치 근처 제휴처</span>
        </button>
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-body-4 font-bold text-purple04">통신사별 인기 혜택</p>
            <h2 className="mt-1 text-title-5 font-bold text-grey06">많이 찾는 혜택</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/benefits')}
            className="text-body-4 font-bold text-purple04"
          >
            전체보기
          </button>
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
            onClick={() => void loadPopularBenefits()}
            className="mt-4 w-full rounded-[22px] bg-white p-5 text-left text-body-3 font-bold text-purple04"
          >
            혜택을 불러오지 못했어요. 다시 시도
          </button>
        ) : null}
        {status === 'ready' && popularBenefits.length === 0 ? (
          <div className="mt-4 rounded-[22px] bg-white p-5 text-body-3 text-grey04">
            표시할 혜택이 없어요.
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {popularBenefits.map((benefit, index) => (
            <button
              key={benefit.benefitId}
              type="button"
              onClick={() => navigate('/benefits')}
              className="flex w-full items-center gap-3 rounded-[22px] bg-white p-4 text-left shadow-[0_10px_26px_rgba(23,17,47,0.06)] active:scale-[0.99]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple01 text-body-4 font-extrabold text-purple05">
                {index + 1}
              </span>
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-grey01 p-2">
                <SafeImage
                  src={benefit.image}
                  alt={`${benefit.benefitName} 로고`}
                  fallbackLabel={benefit.benefitName}
                  className="h-full w-full object-contain text-body-4"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-body-2 font-bold leading-5 text-grey06">
                  {benefit.benefitName}
                </span>
                <span className="mt-1 line-clamp-1 text-body-4 text-grey04">
                  {getCarrierLabel(benefit.carrier)} ·{' '}
                  {benefit.usageType === 'ONLINE' ? '온라인' : '오프라인'} · {benefit.category}
                </span>
                <span className="mt-1 line-clamp-1 text-body-5 text-grey04">
                  {getBenefitDescription(benefit)}
                </span>
              </span>
              <TbStar className="h-5 w-5 shrink-0 text-orange03" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MobileHomePage;
