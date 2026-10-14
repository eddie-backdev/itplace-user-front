import Link from 'next/link';
import { TbChevronRight } from 'react-icons/tb';
import SafeImage from '@/components/SafeImage';
import type { PartnerBenefitItem } from '@/features/allBenefitsPage/apis/allBenefitsApi';
import { type CarrierCode, getCarrierLabel } from '@/utils/membership';
import { getPartnerBenefitPath } from '@/utils/partnerSeo';
import { getPartnerBenefitPreview } from '@/utils/benefitPreview';

export default function PartnerBenefitCard({
  partner,
  href,
  carrier,
}: {
  partner: PartnerBenefitItem;
  href?: string;
  carrier?: CarrierCode;
}) {
  const preview = getPartnerBenefitPreview(partner, carrier);
  const detailPath = getPartnerBenefitPath(partner.partnerId, partner.partnerName);
  return (
    <Link
      href={href ?? `${detailPath}${carrier ? `?carrier=${carrier}` : ''}`}
      className="surface-card group flex min-h-[184px] min-w-0 flex-col p-4 transition-colors hover:border-brand/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:p-5"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--itplace-color-mint)] p-1.5"
        >
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
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-base font-semibold leading-6 tracking-[-0.02em] text-ink">
            {partner.partnerName}
          </h3>
          <p className="text-[13px] leading-5 text-warmMuted">
            {partner.carriers.map(getCarrierLabel).join(' · ')}
          </p>
        </div>
        <TbChevronRight
          size={18}
          className="shrink-0 text-grey03 group-hover:text-ink"
          aria-hidden="true"
        />
      </div>
      <div className="mt-3 flex-1">
        {preview ? (
          <>
            <p className="text-[13px] leading-5 text-warmMuted">
              {getCarrierLabel(preview.carrier)} · {preview.grades}
            </p>
            <p className="mt-1 whitespace-pre-line break-words text-base font-semibold leading-6 tracking-[-0.015em] text-ink">
              {preview.title}
            </p>
            {preview.condition ? (
              <p className="mt-1 whitespace-pre-line break-words text-[14px] leading-6 text-warmMuted">
                {preview.condition}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-base font-semibold leading-6 text-ink">통신사별 혜택 확인</p>
            <p className="mt-1 text-[13px] leading-5 text-warmMuted">
              적용 등급과 이용 조건을 상세에서 확인할 수 있어요.
            </p>
          </>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3 border-t border-warmBorder pt-2.5 text-[13px] leading-5 text-warmMuted">
        <span className="min-w-0 break-words">{preview?.limit || '이용 조건은 상세에서 확인'}</span>
        {preview ? <span className="shrink-0">{preview.usage}</span> : null}
      </div>
    </Link>
  );
}
