import Link from 'next/link';
import { TbChevronRight, TbHeart, TbHistory } from 'react-icons/tb';
import SafeImage from '@/components/SafeImage';
import { getCarrierLabel } from '@/utils/membership';
import { useReferenceData } from '@/components/ReferenceDataProvider';
import { getCategoryLabel } from '@/utils/referenceData';

export type AuthPreviewPartner = {
  partnerId: number;
  partnerName: string;
  category: string;
  image: string;
  carriers: string[];
  href: string;
};

type Props = { partners: AuthPreviewPartner[] };

export default function AuthBenefitsPreview({ partners }: Props) {
  const { data: referenceData } = useReferenceData();
  return (
    <section aria-labelledby="auth-benefits-title" className="w-full max-w-[680px]">
      <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-brand">
        <span aria-hidden="true" className="h-px w-6 bg-brand" />
        통신사별 혜택을 한눈에
      </p>
      <h2
        id="auth-benefits-title"
        className="text-[clamp(2.5rem,4vw,3rem)] font-semibold leading-[1.18] tracking-[-0.055em] text-ink"
      >
        내 멤버십 혜택,
        <br />
        잊지 않고 챙기세요.
      </h2>
      <p className="mt-4 max-w-[520px] text-[15px] leading-7 text-warmMuted">
        SKT, KT, LG U+ 혜택을 비교하고 관심 혜택과 사용 기록을 한곳에서 관리할 수 있어요.
      </p>

      <div className="surface-card mt-8 overflow-hidden p-5 sm:p-6">
        <div className="flex items-end justify-between gap-4 border-b border-warmBorder pb-4">
          <div>
            <h3 className="text-base font-semibold tracking-[-0.02em] text-ink">오늘 살펴볼 혜택</h3>
            <p className="mt-1 text-[13px] leading-5 text-warmMuted">
              통신사와 등급별 이용 조건을 확인하세요
            </p>
          </div>
          <span aria-hidden="true" className="hidden text-[12px] font-medium text-warmMuted sm:block">
            SKT · KT · LG U+
          </span>
        </div>

        <ul aria-label="제휴처 혜택 미리보기" className="divide-y divide-warmBorder">
          {partners.map((partner) => (
            <li key={partner.partnerId}>
              <Link
                href={partner.href}
                aria-label={`${partner.partnerName} ${getCategoryLabel(partner.category, referenceData)} 혜택 보기`}
                className="group flex min-h-[78px] items-center gap-3 py-3 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand sm:gap-4"
              >
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F6F7FA] p-1.5">
                  <SafeImage
                    src={partner.image}
                    alt=""
                    width={44}
                    height={44}
                    fallbackLabel={partner.partnerName}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-[15px] font-semibold leading-5 tracking-[-0.02em] text-ink">{partner.partnerName}</span>
                    <span className="text-[12px] leading-5 text-warmMuted">{getCategoryLabel(partner.category, referenceData)}</span>
                  </span>
                  <span className="mt-1 block text-[12px] leading-4 text-warmMuted">
                    {partner.carriers.map(getCarrierLabel).join(' · ')} 멤버십 혜택
                  </span>
                </span>
                <TbChevronRight
                  aria-hidden="true"
                  size={19}
                  className="shrink-0 text-[#9AA1AC] transition-colors group-hover:text-brand"
                />
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-1 flex flex-wrap gap-x-6 gap-y-2 border-t border-warmBorder pt-4 text-[13px] leading-5 text-[#505966]">
          <span className="inline-flex items-center gap-2">
            <TbHeart aria-hidden="true" size={17} className="text-brand" />
            관심 혜택에 저장
          </span>
          <span className="inline-flex items-center gap-2">
            <TbHistory aria-hidden="true" size={17} className="text-brand" />
            사용한 혜택 기록
          </span>
        </div>
      </div>
      <p className="mt-3 text-[12px] leading-5 text-warmMuted">
        로그인 후 관심 혜택과 사용 기록을 관리할 수 있어요.
      </p>
    </section>
  );
}
