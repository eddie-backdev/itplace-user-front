'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { TbBookmark, TbSearch } from 'react-icons/tb';
import {
  PiAirplaneTiltDuotone,
  PiBookOpenDuotone,
  PiCoffeeDuotone,
  PiFilmSlateDuotone,
  PiShoppingBagDuotone,
  PiSparkleDuotone,
  PiStorefrontDuotone,
  PiTicketDuotone,
} from 'react-icons/pi';
import MembershipSelectionDialog from '@/components/membership/MembershipSelectionDialog';
import SafeImage from '@/components/SafeImage';
import { addFavorite, removeFavorite } from '@/features/mainPage/api/favoriteApi';
import { getFavoritesList } from '@/features/mainPage/api/favoritesListApi';
import type { PartnerBenefitItem } from '@/features/allBenefitsPage/apis/allBenefitsApi';
import { useNavigate, useSearchParams } from '@/lib/navigation';
import { RootState } from '@/store';
import { getPartnerBenefitPreview, hasExplicitPreviewSummary, isPreviewSummaryEligible } from '@/utils/benefitPreview';
import { getPartnerBenefitPath } from '@/utils/partnerSeo';
import { getApplicableTierBenefits } from '../features/allBenefitsPage/apis/tierBenefitResolver.mjs';
import { hasEligibleStructuredOffer, hasStructuredOffers } from '@/features/allBenefitsPage/apis/partnerBenefitModel';
import { getLoginHref } from '@/features/loginPage/utils/returnTo.mjs';
import { showToast } from '@/utils/toast';
import { toCategoryOptions } from '@/utils/referenceData';
import { useReferenceData } from '@/components/ReferenceDataProvider';
import {
  getCarrierLabel,
  getMembershipGradeLabel,
  isCarrierCode,
  isValidCarrierGradePair,
  type CarrierCode,
} from '@/utils/membership';
import styles from './BenefitHomePage.module.css';

export type CarrierHomeSection = {
  carrier: CarrierCode;
  partners: PartnerBenefitItem[] | null;
};

const categoryIcons: Record<string, typeof PiCoffeeDuotone> = {
  푸드: PiCoffeeDuotone, '생활/편의': PiStorefrontDuotone, '뷰티/건강': PiSparkleDuotone,
  '문화/여가': PiFilmSlateDuotone, 엑티비티: PiTicketDuotone, '여행/교통': PiAirplaneTiltDuotone,
  쇼핑: PiShoppingBagDuotone, 교육: PiBookOpenDuotone,
};
const emptyPartners: PartnerBenefitItem[] = [];
const focus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2';

function eligiblePreview(partner: PartnerBenefitItem, carrier: CarrierCode, grade: string, referenceData?: import('@/utils/referenceData').ReferenceData | null) {
  return partner.previews?.find((preview) => {
    if (preview.carrier !== carrier) return false;
    if (hasExplicitPreviewSummary(preview)) {
      return preview.summary === null || isPreviewSummaryEligible(preview, grade, referenceData);
    }
    return hasStructuredOffers(preview)
      ? hasEligibleStructuredOffer(preview, carrier, grade, referenceData)
      : getApplicableTierBenefits(preview.tierBenefits, carrier, grade).length > 0;
  });
}

function getOfferPath(partner: PartnerBenefitItem, carrier: CarrierCode, grade: string) {
  const params = new URLSearchParams({ carrier, grade });
  return `${getPartnerBenefitPath(partner.partnerId, partner.partnerName)}?${params.toString()}`;
}

function getPreviewDetails(condition?: string, limit?: string, fallback?: string) {
  const primary = condition?.trim();
  const secondary = limit?.trim();
  if (!primary) return secondary || fallback;
  if (!secondary || primary.includes(secondary) || secondary.includes(primary)) {
    return primary.length >= (secondary?.length ?? 0) ? primary : secondary;
  }
  return `${primary} · ${secondary}`;
}

function OfferSaveButton({
  benefitId,
  partnerName,
  isSaved,
  isReady,
  favoritesReady,
  isLoggedIn,
  onChange,
  returnTo,
}: {
  benefitId: number;
  partnerName: string;
  isSaved: boolean;
  isLoggedIn: boolean;
  isReady: boolean;
  favoritesReady: boolean;
  onChange: (id: number, saved: boolean) => void;
  returnTo: string;
}) {
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const toggle = async () => {
    if (!isReady) {
      showToast('로그인 상태를 확인하고 있어요. 잠시 후 다시 시도해 주세요.', 'info');
      return;
    }
    if (!isLoggedIn) {
      navigate(getLoginHref(returnTo));
      return;
    }
    if (!favoritesReady) {
      showToast('관심 혜택 정보를 불러오는 중이에요. 잠시 후 다시 시도해 주세요.', 'info');
      return;
    }
    setBusy(true);
    try {
      if (isSaved) await removeFavorite([benefitId]);
      else await addFavorite(benefitId);
      onChange(benefitId, !isSaved);
    } catch {
      showToast('관심 혜택을 변경하지 못했어요. 다시 시도해 주세요.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`${styles.saveButton} ${focus}`}
      aria-label={isSaved ? `${partnerName} 관심 혜택에서 해제` : `${partnerName} 관심 혜택에 추가`}
      aria-pressed={isSaved}
      disabled={busy}
      onClick={() => void toggle()}
    >
      <TbBookmark aria-hidden="true" size={20} fill={isSaved ? 'currentColor' : 'none'} />
    </button>
  );
}

export default function BenefitHomePage({
  sections,
  selectedCarrier,
  selectedGrade,
}: {
  sections: CarrierHomeSection[];
  selectedCarrier: CarrierCode;
  selectedGrade: string;
}) {
  const { data: referenceData } = useReferenceData();
  const [searchParams, setSearchParams] = useSearchParams();
  const auth = useSelector((state: RootState) => state.auth);
  const isRehydrated = useSelector((state: RootState) => state._persist.rehydrated);
  const [membershipOpen, setMembershipOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(() => new Set());
  const [favoritesReady, setFavoritesReady] = useState(false);
  const isLoggedIn = auth.isLoggedIn && isRehydrated;
  const isAuthReady = isRehydrated;
  const section = sections.find((item) => item.carrier === selectedCarrier);
  const isLoadError = section?.partners == null;
  const partners = section?.partners ?? emptyPartners;
  const partnerOffers = useMemo(
    () =>
      partners.flatMap((partner) => {
        const raw = eligiblePreview(partner, selectedCarrier, selectedGrade, referenceData);
        const preview = getPartnerBenefitPreview(partner, selectedCarrier, selectedGrade, referenceData);
        return raw && preview ? [{ partner, raw, preview }] : [];
      }),
    [partners, referenceData, selectedCarrier, selectedGrade]
  );

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn) {
      setFavoriteIds(new Set());
      setFavoritesReady(true);
      return;
    }
    let active = true;
    setFavoritesReady(false);
    getFavoritesList({})
      .then((favorites) => {
        if (active) {
          setFavoriteIds(new Set(favorites.map((favorite) => favorite.benefitId)));
          setFavoritesReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setFavoriteIds(new Set());
          setFavoritesReady(false);
        }
      });
    return () => {
      active = false;
    };
  }, [isAuthReady, isLoggedIn]);

  const topOffers = partnerOffers.slice(0, 3);
  const shelfOffers = partnerOffers.slice(3, 8);

  const openMembership = () => {
    setMembershipOpen(true);
  };

  const applyMembership = (carrier: string, grade: string) => {
    if (!isCarrierCode(carrier) || !isValidCarrierGradePair(carrier, grade, referenceData)) return;
    const next = new URLSearchParams(searchParams);
    next.set('carrier', carrier);
    next.set('grade', grade);
    setSearchParams(next);
    setMembershipOpen(false);
  };

  const updateFavorite = (id: number, saved: boolean) => {
    setFavoriteIds((previous) => {
      const next = new Set(previous);
      if (saved) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const selectedLabel = `${getCarrierLabel(selectedCarrier)} ${getMembershipGradeLabel(selectedGrade, referenceData)}`;
  const selectionQuery = new URLSearchParams({
    carrier: selectedCarrier,
    grade: selectedGrade,
  }).toString();
  const selectedCategory = searchParams.get('category');
  const returnTo = selectedCategory
    ? `/?${selectionQuery}&category=${encodeURIComponent(selectedCategory)}`
    : `/?${selectionQuery}`;

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <section className={styles.intro} aria-labelledby="home-title">
          <h1 id="home-title">어디에서 쓰고 싶으세요?</h1>
          <form action="/benefits" method="get" role="search" className={styles.searchForm}>
            <TbSearch aria-hidden="true" size={21} className={styles.searchIcon} />
            <label className="sr-only" htmlFor="home-search">
              브랜드나 혜택 검색
            </label>
            <input
              id="home-search"
              name="q"
              type="search"
              maxLength={100}
              placeholder="브랜드나 필요한 혜택을 검색해 보세요"
            />
            <input type="hidden" name="carrier" value={selectedCarrier} />
            <input type="hidden" name="grade" value={selectedGrade} />
            {selectedCategory && selectedCategory !== '전체' ? (
              <input type="hidden" name="category" value={selectedCategory} />
            ) : null}
            <button type="submit">찾기</button>
          </form>
        </section>

        <nav aria-label="혜택 카테고리" className={styles.categoryPanel}>
          <h2 className="sr-only">혜택 카테고리</h2>
          <div className={styles.categoryGrid}>
            {toCategoryOptions(referenceData).filter(({ id }) => id !== '전체').map(({ id, name }) => {
              const Icon = categoryIcons[id] ?? PiSparkleDuotone;
              return (
                <Link
                  key={id}
                  href={`/benefits?${selectionQuery}&category=${encodeURIComponent(id)}`}
                  className={`${styles.categoryLink} ${focus}`}
                >
                  <span className={styles.categoryIcon}>
                    <Icon aria-hidden="true" size={32} />
                  </span>
                  <span>{name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <section className={styles.featureSection} aria-labelledby="feature-heading">
          <div className={styles.sectionHeading}>
            <h2 id="feature-heading">받을 수 있는 혜택</h2>
            <Link href={`/benefits?${selectionQuery}`} className={`${styles.moreLink} ${focus}`}>
              전체 혜택
            </Link>
          </div>
          {topOffers.length ? (
            <div
              className={`${styles.featureBlock} ${topOffers.length === 1 ? styles.singleOffer : ''}`}
            >
              <article className={styles.primaryOffer}>
                <div className={styles.primaryBrandRow}>
                  <SafeImage
                    src={topOffers[0].partner.image}
                    alt=""
                    width={56}
                    height={56}
                    fallbackLabel={topOffers[0].partner.partnerName}
                    className={styles.primaryLogo}
                  />
                  <div className={styles.primaryBrand}>
                    <strong>{topOffers[0].partner.partnerName}</strong>
                    <span>{selectedLabel} 멤버십</span>
                  </div>
                  <OfferSaveButton
                    benefitId={topOffers[0].raw.benefitId}
                    partnerName={topOffers[0].partner.partnerName}
                    isSaved={favoriteIds.has(topOffers[0].raw.benefitId)}
                    isLoggedIn={isLoggedIn}
                    isReady={isAuthReady}
                    favoritesReady={favoritesReady}
                    onChange={updateFavorite}
                    returnTo={returnTo}
                  />
                </div>
                <h3>{topOffers[0].preview.title}</h3>
                <p className={styles.primaryCondition}>
                  {getPreviewDetails(
                    topOffers[0].preview.condition,
                    topOffers[0].preview.limit,
                    selectedLabel
                  )}
                </p>
                <div className={styles.primaryActions}>
                  <Link
                    href={getOfferPath(topOffers[0].partner, selectedCarrier, selectedGrade)}
                    className={`${styles.primaryLink} ${focus}`}
                    aria-label={`${topOffers[0].partner.partnerName} 이용 조건 보기`}
                  >
                    이용 조건 보기
                  </Link>
                </div>
              </article>
              {topOffers.length > 1 ? (
                <div className={styles.secondaryOffers}>
                  {topOffers.slice(1).map(({ partner, raw, preview }) => (
                    <article key={partner.partnerId} className={styles.secondaryOffer}>
                      <div className={styles.cardTop}>
                        <div className={styles.brandLockup}>
                          <SafeImage
                            src={partner.image}
                            alt=""
                            width={44}
                            height={44}
                            fallbackLabel={partner.partnerName}
                            className={styles.brandLogo}
                          />
                          <strong>{partner.partnerName}</strong>
                        </div>
                        <OfferSaveButton
                          benefitId={raw.benefitId}
                          partnerName={partner.partnerName}
                          isSaved={favoriteIds.has(raw.benefitId)}
                          isLoggedIn={isLoggedIn}
                          isReady={isAuthReady}
                          favoritesReady={favoritesReady}
                          onChange={updateFavorite}
                          returnTo={returnTo}
                        />
                      </div>
                      <h3>{preview.title}</h3>
                      <p className={styles.offerCondition}>
                        {getPreviewDetails(preview.condition, preview.limit, selectedLabel)}
                      </p>
                      <Link
                        href={getOfferPath(partner, selectedCarrier, selectedGrade)}
                        className={`${styles.offerLink} ${focus}`}
                        aria-label={`${partner.partnerName} 이용 조건 보기`}
                      >
                        이용 조건 보기
                      </Link>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className={styles.emptyOffers}>
              <h3>{isLoadError ? '혜택을 불러오지 못했어요.' : '아직 표시할 혜택이 없어요.'}</h3>
              <p>
                {isLoadError
                  ? '잠시 후 다시 확인하거나 다른 멤버십을 선택해 주세요.'
                  : '다른 멤버십이나 전체 혜택을 살펴보세요.'}
              </p>
              <button className={styles.offerLink} type="button" onClick={openMembership}>
                멤버십 선택
              </button>
            </div>
          )}
        </section>

        <section className={styles.shelfSection} aria-labelledby="shelf-heading">
          <div className={styles.sectionHeading}>
            <h2 id="shelf-heading">브랜드별로 둘러보기</h2>
          </div>
          {shelfOffers.length ? (
            <div className={styles.shelf}>
              {shelfOffers.map(({ partner, preview }) => (
                <Link
                  key={partner.partnerId}
                  href={getOfferPath(partner, selectedCarrier, selectedGrade)}
                  className={`${styles.shelfItem} ${focus}`}
                >
                  <SafeImage
                    src={partner.image}
                    alt=""
                    width={42}
                    height={42}
                    fallbackLabel={partner.partnerName}
                    className={styles.shelfLogo}
                  />
                  <span className={styles.shelfCopy}>
                    <strong>{partner.partnerName}</strong>
                    <span>{preview.title}</span>
                    <small>{getPreviewDetails(preview.condition, preview.limit, selectedLabel)}</small>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.emptyNote}>더 많은 혜택은 전체 혜택에서 확인할 수 있어요.</p>
          )}
        </section>

        <p className={styles.serviceNote}>
          혜택은 변경될 수 있어요. 이용 전에 상세 조건을 확인해 주세요.
        </p>
      </div>

      <MembershipSelectionDialog
        isOpen={membershipOpen}
        carrier={selectedCarrier}
        grade={selectedGrade}
        onClose={() => setMembershipOpen(false)}
        onApply={applyMembership}
      />
    </div>
  );
}
