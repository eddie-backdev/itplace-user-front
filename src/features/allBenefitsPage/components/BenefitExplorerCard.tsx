import Link from 'next/link';
import { TbBookmark, TbBookmarkFilled, TbChevronRight } from 'react-icons/tb';
import SafeImage from '@/components/SafeImage';
import type { PartnerBenefitItem } from '@/features/allBenefitsPage/apis/allBenefitsApi';
import { type CarrierCode, getCarrierLabel } from '@/utils/membership';
import { getPartnerBenefitPreview } from '@/utils/benefitPreview';
import styles from './BenefitExplorerCard.module.css';

type BenefitExplorerCardProps = {
  partner: PartnerBenefitItem;
  href: string;
  carrier?: CarrierCode;
  grade?: string;
  onPreview?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  isFavorite?: boolean;
  favoriteBusy?: boolean;
  onToggleFavorite?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export default function BenefitExplorerCard({
  partner,
  href,
  carrier,
  grade,
  onPreview,
  isFavorite = false,
  favoriteBusy = false,
  onToggleFavorite,
}: BenefitExplorerCardProps) {
  const preview =
    getPartnerBenefitPreview(partner, carrier, grade) ?? getPartnerBenefitPreview(partner);
  const otherCarrierCount = preview
    ? new Set(
        partner.carriers.filter(
          (code) => code !== preview.carrier && getPartnerBenefitPreview(partner, code)
        )
      ).size
    : 0;

  return (
    <article className={styles.card}>
      <Link href={href} prefetch={false} onClick={onPreview} className={styles.detailLink}>
        <span className={styles.brandGroup}>
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
          <span className={styles.partnerCopy}>
            <span className={styles.partnerName}>{partner.partnerName}</span>
            <span className={styles.metadata}>
              {getCarrierLabel(preview?.carrier ?? carrier ?? partner.carriers[0])} ·{' '}
              {partner.category ?? '분야 미분류'}
              {otherCarrierCount > 0 ? ` · 다른 통신사 혜택 ${otherCarrierCount}개` : ''}
            </span>
          </span>
        </span>
        <span className={styles.benefitCopy}>
          <span className={styles.headline} title={preview?.title ?? '혜택 정보 확인'}>
            {preview?.title ?? '혜택 정보 확인'}
          </span>
          <span className={styles.condition}>
            {preview?.condition ||
              (preview ? `${preview.grades} · ${preview.usage}` : '혜택 조건은 상세에서 확인')}
          </span>
        </span>
      </Link>
      <span className={styles.limit}>{preview?.limit || '이용 제한 상세 확인'}</span>
      <button
        type="button"
        className={styles.favoriteButton}
        onClick={onToggleFavorite}
        disabled={favoriteBusy || !onToggleFavorite}
        aria-label={`${partner.partnerName} 관심 혜택 ${isFavorite ? '해제' : '추가'}`}
        aria-pressed={isFavorite}
      >
        {isFavorite ? <TbBookmarkFilled aria-hidden="true" /> : <TbBookmark aria-hidden="true" />}
      </button>
      <Link href={href} prefetch={false} onClick={onPreview} className={styles.openDetail}>
        자세히 <TbChevronRight size={16} aria-hidden="true" />
      </Link>
    </article>
  );
}
