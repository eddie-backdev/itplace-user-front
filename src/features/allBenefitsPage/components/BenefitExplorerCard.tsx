import Link from 'next/link';
import { TbChevronRight } from 'react-icons/tb';
import SafeImage from '@/components/SafeImage';
import type { PartnerBenefitItem } from '@/features/allBenefitsPage/apis/allBenefitsApi';
import { type CarrierCode, getCarrierLabel } from '@/utils/membership';
import { getPartnerBenefitPreview, getPartnerBenefitPreviews } from '@/utils/benefitPreview';
import styles from './BenefitExplorerCard.module.css';

type BenefitExplorerCardProps = {
  partner: PartnerBenefitItem;
  href: string;
  carrier?: CarrierCode;
  grade?: string;
  selected?: boolean;
  onSelect?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
};

export default function BenefitExplorerCard({
  partner,
  href,
  carrier,
  grade,
  selected = false,
  onSelect,
}: BenefitExplorerCardProps) {
  const carrierPreviews =
    !carrier && !grade && partner.carriers.length > 1 ? getPartnerBenefitPreviews(partner) : null;
  const preview = carrierPreviews ? null : getPartnerBenefitPreview(partner, carrier, grade);

  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      className={`${styles.card}${selected ? ` ${styles.selected}` : ''}`}
    >
      <div className={styles.header}>
        <span className={styles.logo} aria-hidden="true">
          <SafeImage
            src={partner.image}
            alt=""
            width={64}
            height={64}
            fallbackLabel={partner.partnerName}
            loading="lazy"
            className={styles.logoImage}
          />
        </span>
        <h3 className={styles.partnerName}>{partner.partnerName}</h3>
        <TbChevronRight className={styles.arrow} size={18} aria-hidden="true" />
      </div>

      <div className={styles.details}>
        {carrierPreviews ? (
          <div className={styles.previewRows}>
            {carrierPreviews.map((item) => {
              const summary = [item.grades, item.title, item.condition].filter(Boolean).join(' · ');
              return (
                <div key={item.carrier} className={styles.previewRow} title={summary}>
                  <span className={styles.previewCarrier}>{getCarrierLabel(item.carrier)}</span>
                  <span className={styles.previewSummary}>{summary}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <p className={styles.headline} title={preview?.title ?? '혜택 조건 확인'}>
              {preview?.title ?? '혜택 조건 확인'}
            </p>
            <p className={styles.metadata}>
              {preview
                ? `${getCarrierLabel(preview.carrier)} · ${preview.grades}`
                : carrier
                  ? `${getCarrierLabel(carrier)} · 상세에서 확인`
                  : `${partner.carriers.map(getCarrierLabel).join(' · ')} · 상세에서 확인`}
            </p>
          </>
        )}
      </div>

      {!carrierPreviews ? (
        <p className={styles.limit}>{preview?.limit || '이용 조건은 상세에서 확인'}</p>
      ) : null}
    </Link>
  );
}
