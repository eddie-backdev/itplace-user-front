import Link from 'next/link';
import { TbBookmark, TbBookmarkFilled, TbChevronRight } from 'react-icons/tb';
import SafeImage from '@/components/SafeImage';
import type { PartnerBenefitItem } from '@/features/allBenefitsPage/apis/allBenefitsApi';
import { type CarrierCode, getCarrierLabel } from '@/utils/membership';
import { getPartnerBenefitPreview } from '@/utils/benefitPreview';
import styles from './BenefitExplorerCard.module.css';
import { useReferenceData } from '@/components/ReferenceDataProvider';
import { getCategoryLabel } from '@/utils/referenceData';
import { formatSourceCapturedDate } from '../apis/benefitConditions.mjs';

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
  const { data: referenceData } = useReferenceData();
  const preview =
    getPartnerBenefitPreview(partner, carrier, grade, referenceData) ?? getPartnerBenefitPreview(partner, undefined, undefined, referenceData);
  const sourcePreview = partner.previews?.find((item) => item.carrier === preview?.carrier);
  const otherCarrierCount = preview
    ? new Set(
        partner.carriers.filter(
          (code) => code !== preview.carrier && getPartnerBenefitPreview(partner, code, undefined, referenceData)
        )
      ).size
    : 0;
  const capturedDate = formatSourceCapturedDate(sourcePreview?.sourceCapturedAt);
  const safeSourceUrl = (() => {
    try {
      const url = new URL(sourcePreview?.sourceUrl ?? '');
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
    } catch { return null; }
  })();

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
              {getCategoryLabel(partner.category, referenceData) || '카테고리 미분류'}
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
      {sourcePreview?.offerResolution === 'PARTIAL' || sourcePreview?.offerResolution === 'UNRESOLVED' ? (
        <details className="px-3 pb-2 text-sm leading-6 text-[var(--itplace-color-text-secondary)]">
          <summary className="min-h-11 cursor-pointer py-2 font-medium">추가 이용 안내</summary>
          <p>상세 원문에 추가 조건이 있어요. 이용 전에 적용 등급과 제한 사항을 확인해 주세요.</p>
          <Link href={href} prefetch={false} onClick={onPreview} className="mt-2 inline-block underline">혜택별 상세와 전체 원문 보기</Link>
          {safeSourceUrl ? <a href={safeSourceUrl} target="_blank" rel="noreferrer" className="ml-3 underline">공식 출처</a> : null}
          {capturedDate ? <p className="mt-2 text-xs">{capturedDate} 확인</p> : null}
        </details>
      ) : null}
    </article>
  );
}
