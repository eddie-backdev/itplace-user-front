'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { TbBookmark, TbBookmarkFilled, TbExternalLink, TbMapPin } from 'react-icons/tb';
import { Link, useNavigate } from '@/lib/navigation';
import SafeImage from '@/components/SafeImage';
import NearbyStoresButton from './NearbyStoresButton';
import type { RootState } from '@/store';
import {
  addFavorite,
  getPartnerBenefitDetail,
  getCarrierBenefitDisplayName,
  getMembershipOptionLabel,
  getSourceOptionLabel,
  removeFavorite,
  type CarrierBenefitDetail,
  type PartnerBenefitDetailResponse,
  type PartnerBenefitItem,
} from '../apis/allBenefitsApi';
import { getCarrierLabel, getMembershipGradeLabel, type CarrierCode } from '@/utils/membership';
import { getLoginHref } from '@/features/loginPage/utils/returnTo.mjs';
import styles from './BenefitExplorerDetail.module.css';

interface BenefitExplorerDetailProps {
  partner: PartnerBenefitItem;
  carrier?: CarrierCode;
  grade?: string;
  detailHref: string;
}

const usageLabel = (type: CarrierBenefitDetail['usageType']) => {
  if (type === 'ONLINE') return '온라인';
  if (type === 'OFFLINE') return '오프라인';
  return '온라인 · 오프라인';
};

const validHttpUrl = (value?: string | null) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
};

export default function BenefitExplorerDetail({
  partner,
  carrier,
  grade,
  detailHref,
}: BenefitExplorerDetailProps) {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const isAuthRehydrated = useSelector((state: RootState) => state._persist.rehydrated);
  const [detail, setDetail] = useState<PartnerBenefitDetailResponse | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierCode | null>(carrier ?? null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const [pendingFavoriteId, setPendingFavoriteId] = useState<number | null>(null);
  const [favoriteErrorId, setFavoriteErrorId] = useState<number | null>(null);
  const requestId = useRef(0);
  const favoriteRequestId = useRef(0);

  const retry = useCallback(() => setRetryCount((count) => count + 1), []);

  useEffect(() => {
    if (!isAuthRehydrated) return;
    const currentRequestId = ++requestId.current;
    favoriteRequestId.current += 1;
    let cancelled = false;
    setStatus('loading');
    setDetail(null);
    setSelectedCarrier(carrier ?? null);
    setPendingFavoriteId(null);
    setFavoriteErrorId(null);

    void getPartnerBenefitDetail(partner.partnerId, carrier ? { carrier, grade } : undefined).then(
      (response) => {
        if (cancelled || requestId.current !== currentRequestId) return;
        setDetail(response);
        setStatus('ready');
        if (!carrier) {
          setSelectedCarrier((selected) =>
            selected && response.carrierGroups.some((group) => group.carrier === selected)
              ? selected
              : (response.carrierGroups[0]?.carrier ?? null)
          );
        }
      },
      () => {
        if (!cancelled && requestId.current === currentRequestId) setStatus('error');
      }
    );

    return () => {
      cancelled = true;
    };
  }, [carrier, grade, isAuthRehydrated, isLoggedIn, partner.partnerId, retryCount]);

  useEffect(
    () => () => {
      requestId.current += 1;
      favoriteRequestId.current += 1;
    },
    []
  );

  const selectedGroup = useMemo(
    () => detail?.carrierGroups.find((group) => group.carrier === selectedCarrier) ?? null,
    [detail, selectedCarrier]
  );

  const orderedBenefits = useMemo(() => {
    if (!selectedGroup) return [];
    const preferredIds = (partner.previews ?? [])
      .filter((preview) => preview.carrier === selectedGroup.carrier)
      .sort((a, b) => {
        const aMatchesGrade =
          !grade || a.tierBenefits.some((tier) => tier.isAll || tier.grade === grade);
        const bMatchesGrade =
          !grade || b.tierBenefits.some((tier) => tier.isAll || tier.grade === grade);
        if (aMatchesGrade !== bMatchesGrade) return aMatchesGrade ? -1 : 1;
        const aHasContext = a.tierBenefits.some((tier) => tier.context?.trim());
        const bHasContext = b.tierBenefits.some((tier) => tier.context?.trim());
        return Number(bHasContext) - Number(aHasContext);
      })
      .map((preview) => preview.benefitId);
    const rank = new Map(preferredIds.map((id, index) => [id, index]));
    return [...selectedGroup.benefits].sort(
      (a, b) =>
        (rank.get(a.benefitId) ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(b.benefitId) ?? Number.MAX_SAFE_INTEGER)
    );
  }, [grade, partner.previews, selectedGroup]);

  const toggleFavorite = async (benefit: CarrierBenefitDetail) => {
    if (pendingFavoriteId !== null) return;
    if (!isAuthRehydrated || !isLoggedIn) {
      const returnTo = `${window.location.pathname}${window.location.search}#benefit-${benefit.benefitId}`;
      navigate(getLoginHref(returnTo));
      return;
    }

    const currentFavoriteRequestId = ++favoriteRequestId.current;
    setPendingFavoriteId(benefit.benefitId);
    setFavoriteErrorId(null);
    try {
      if (benefit.isFavorite) await removeFavorite(benefit.benefitId);
      else await addFavorite(benefit.benefitId);
      if (favoriteRequestId.current !== currentFavoriteRequestId) return;
      setDetail((current) =>
        current
          ? {
              ...current,
              carrierGroups: current.carrierGroups.map((group) => ({
                ...group,
                benefits: group.benefits.map((item) =>
                  item.benefitId === benefit.benefitId
                    ? {
                        ...item,
                        isFavorite: !benefit.isFavorite,
                        favoriteCount: Math.max(
                          0,
                          item.favoriteCount + (benefit.isFavorite ? -1 : 1)
                        ),
                      }
                    : item
                ),
              })),
            }
          : current
      );
    } catch {
      if (favoriteRequestId.current === currentFavoriteRequestId) {
        setFavoriteErrorId(benefit.benefitId);
      }
    } finally {
      if (favoriteRequestId.current === currentFavoriteRequestId) setPendingFavoriteId(null);
    }
  };

  const detailReturnHref = (benefitId?: number) => {
    if (!benefitId) return detailHref;
    const hash = `#benefit-${benefitId}`;
    return detailHref.includes('#') ? `${detailHref.split('#')[0]}${hash}` : `${detailHref}${hash}`;
  };

  const renderBenefit = (benefit: CarrierBenefitDetail) => {
    const officialUrl = validHttpUrl(benefit.url);
    const tierConditions = benefit.tierBenefits
      .filter((tier) => tier.context?.trim())
      .reduce<Array<{ context: string; grades: string[] }>>((groups, tier) => {
        const context = tier.context.trim();
        const existing = groups.find((group) => group.context === context);
        const label = tier.isAll ? '전체 등급' : getMembershipGradeLabel(tier.grade);
        if (existing) {
          if (!existing.grades.includes(label)) existing.grades.push(label);
        } else {
          groups.push({ context, grades: [label] });
        }
        return groups;
      }, []);

    return (
      <article
        className={styles.benefit}
        id={`benefit-${benefit.benefitId}`}
        key={benefit.benefitId}
      >
        <header className={styles.benefitHeader}>
          <div className={styles.titleBlock}>
            <h3>{getCarrierBenefitDisplayName(benefit)}</h3>
            {getMembershipOptionLabel(benefit) && (
              <span className={styles.optionLabel}>{getMembershipOptionLabel(benefit)}</span>
            )}
            {getSourceOptionLabel(benefit) && (
              <p className={styles.sourceOptionLabel}>
                원본 선택명: {getSourceOptionLabel(benefit)}
              </p>
            )}
            <p>{usageLabel(benefit.usageType)}</p>
          </div>
          <button
            type="button"
            className={styles.favoriteButton}
            aria-label={benefit.isFavorite ? '관심 혜택에서 제거' : '관심 혜택에 저장'}
            aria-pressed={benefit.isFavorite}
            disabled={!isAuthRehydrated || pendingFavoriteId !== null}
            onClick={() => void toggleFavorite(benefit)}
          >
            {benefit.isFavorite ? (
              <TbBookmarkFilled aria-hidden="true" />
            ) : (
              <TbBookmark aria-hidden="true" />
            )}
          </button>
        </header>

        {grade && <p className={styles.gradeContext}>{getMembershipGradeLabel(grade)} 기준 혜택</p>}
        {tierConditions.length > 0 ? (
          <ul className={styles.tierList} aria-label="등급별 혜택">
            {tierConditions.map((condition) => (
              <li key={condition.context}>
                <span className={styles.tierGrade}>{condition.grades.join(', ')}</span>
                <p>{condition.context}</p>
              </li>
            ))}
          </ul>
        ) : benefit.description ? (
          <p className={styles.description}>{benefit.description}</p>
        ) : null}

        {benefit.benefitLimit && (
          <dl className={styles.limitRow}>
            <dt>이용 제한</dt>
            <dd>{benefit.benefitLimit}</dd>
          </dl>
        )}
        {favoriteErrorId === benefit.benefitId && (
          <p className={styles.errorMessage} role="alert">
            저장 상태를 변경하지 못했습니다. 다시 시도해 주세요.
          </p>
        )}
        {(benefit.manual ||
          benefit.sourceUrl ||
          (tierConditions.length > 0 && benefit.description)) && (
          <details className={styles.moreDetails}>
            <summary>이용 안내 및 유의사항</summary>
            <div className={styles.longText}>
              {tierConditions.length > 0 && benefit.description && <p>{benefit.description}</p>}
              {benefit.manual && <p>{benefit.manual}</p>}
              {validHttpUrl(benefit.sourceUrl) && (
                <a
                  href={validHttpUrl(benefit.sourceUrl) ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                >
                  안내 출처 보기 <TbExternalLink aria-hidden="true" />
                </a>
              )}
            </div>
          </details>
        )}
        <div className={styles.actions}>
          {benefit.usageType !== 'ONLINE' ? (
            <NearbyStoresButton
              partner={{
                partnerId: partner.partnerId,
                partnerName: detail?.partnerName ?? partner.partnerName,
                image: detail?.image ?? partner.image,
              }}
              className={styles.primaryAction}
            >
              <TbMapPin aria-hidden="true" /> 주변 매장 찾기
            </NearbyStoresButton>
          ) : officialUrl ? (
            <a className={styles.primaryAction} href={officialUrl} target="_blank" rel="noreferrer">
              혜택 페이지 <TbExternalLink aria-hidden="true" />
            </a>
          ) : null}
          <Link className={styles.detailAction} to={detailReturnHref(benefit.benefitId)}>
            이용 조건 자세히
          </Link>
        </div>
      </article>
    );
  };

  return (
    <aside className={styles.panel} aria-labelledby="benefit-explorer-heading">
      <header className={styles.panelHeader}>
        <h2 id="benefit-explorer-heading">선택한 혜택</h2>
      </header>
      {status === 'loading' ? (
        <p className={styles.message} role="status">
          혜택 정보를 불러오는 중입니다.
        </p>
      ) : status === 'error' ? (
        <div className={styles.messageBlock} role="alert">
          <p>혜택 정보를 불러오지 못했습니다.</p>
          <button className={styles.textButton} type="button" onClick={retry}>
            다시 시도
          </button>
        </div>
      ) : !selectedGroup || orderedBenefits.length === 0 ? (
        <div className={styles.messageBlock}>
          <p>이 조건에 해당하는 혜택이 없습니다.</p>
          <span>다른 통신사나 등급을 선택해 보세요.</span>
        </div>
      ) : (
        <>
          <section className={styles.identity} aria-label="제휴처 정보">
            <div className={styles.logo}>
              <SafeImage
                src={detail?.image ?? partner.image}
                alt={`${detail?.partnerName ?? partner.partnerName} 로고`}
                fallbackLabel={detail?.partnerName ?? partner.partnerName}
                width={64}
                height={64}
                className={styles.logoImage}
                fallbackClassName={styles.logoFallback}
              />
            </div>
            <div className={styles.identityText}>
              <h3>{detail?.partnerName ?? partner.partnerName}</h3>
              {(detail?.category ?? partner.category) && (
                <p>{detail?.category ?? partner.category}</p>
              )}
            </div>
          </section>
          {!carrier && detail && detail.carrierGroups.length > 1 ? (
            <div className={styles.carrierPicker} aria-label="통신사별 혜택 선택">
              {detail.carrierGroups.map((group) => (
                <button
                  key={group.carrier}
                  type="button"
                  aria-pressed={selectedCarrier === group.carrier}
                  className={`${styles.carrierButton} ${selectedCarrier === group.carrier ? styles.carrierButtonActive : ''}`}
                  onClick={() => setSelectedCarrier(group.carrier)}
                >
                  {getCarrierLabel(group.carrier)}
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.carrierLabel}>{getCarrierLabel(selectedGroup.carrier)}</p>
          )}
          <div className={styles.benefits}>
            {renderBenefit(orderedBenefits[0])}
            {orderedBenefits.length > 1 && (
              <details className={styles.otherBenefits}>
                <summary>다른 혜택 {orderedBenefits.length - 1}개 보기</summary>
                {orderedBenefits.slice(1).map(renderBenefit)}
              </details>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
