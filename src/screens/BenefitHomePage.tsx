'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { TbBookmark, TbSearch } from 'react-icons/tb';
import MembershipSelectionDialog from '@/components/membership/MembershipSelectionDialog';
import SafeImage from '@/components/SafeImage';
import { addFavorite, removeFavorite } from '@/features/mainPage/api/favoriteApi';
import { getFavoritesList } from '@/features/mainPage/api/favoritesListApi';
import type { PartnerBenefitItem } from '@/features/allBenefitsPage/apis/allBenefitsApi';
import { useNavigate, useSearchParams } from '@/lib/navigation';
import { RootState } from '@/store';
import { getPartnerBenefitPreview } from '@/utils/benefitPreview';
import { getPartnerBenefitPath } from '@/utils/partnerSeo';
import { getLoginHref } from '@/features/loginPage/utils/returnTo.mjs';
import { showToast } from '@/utils/toast';
import { CATEGORIES } from '@/features/mainPage/constants';
import {
  getCarrierLabel,
  getMembershipGradeLabel,
  isCarrierCode,
  isGradeApplicableToProfile,
  isValidCarrierGradePair,
  type CarrierCode,
} from '@/utils/membership';
import styles from './BenefitHomePage.module.css';

export type CarrierHomeSection = {
  carrier: CarrierCode;
  partners: PartnerBenefitItem[] | null;
};

const preferredCategories = [
  '전체',
  '생활/편의',
  '푸드',
  '쇼핑',
  '뷰티/건강',
  '엑티비티',
  '문화/여가',
];
const emptyPartners: PartnerBenefitItem[] = [];
const focus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2';

function eligiblePreview(partner: PartnerBenefitItem, carrier: CarrierCode, grade: string) {
  return partner.previews?.find(
    (preview) =>
      preview.carrier === carrier &&
      preview.tierBenefits.some(
        (tier) =>
          !grade ||
          tier.isAll ||
          isGradeApplicableToProfile({
            benefitCarrier: carrier,
            benefitGrade: tier.grade,
            userCarrier: carrier,
            userGrade: grade,
          })
      )
  );
}

const isCoffeeOffer = (partner: PartnerBenefitItem) =>
  partner.category === '커피·음료' ||
  partner.category === 'coffee' ||
  partner.partnerName === '공차';

function getOfferPath(partner: PartnerBenefitItem, carrier: CarrierCode, grade: string) {
  const params = new URLSearchParams({ carrier, grade });
  return `${getPartnerBenefitPath(partner.partnerId, partner.partnerName)}?${params.toString()}`;
}

function OfferSaveButton({
  benefitId,
  isSaved,
  isReady,
  favoritesReady,
  isLoggedIn,
  onChange,
  returnTo,
}: {
  benefitId: number;
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
      showToast('저장 상태를 불러오는 중이에요. 잠시 후 다시 시도해 주세요.', 'info');
      return;
    }
    setBusy(true);
    try {
      if (isSaved) await removeFavorite([benefitId]);
      else await addFavorite(benefitId);
      onChange(benefitId, !isSaved);
    } catch {
      showToast('혜택 저장 상태를 바꾸지 못했어요. 다시 시도해 주세요.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`${styles.saveButton} ${focus}`}
      aria-label={isSaved ? '저장한 혜택에서 삭제' : '혜택 저장'}
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
  const [searchParams, setSearchParams] = useSearchParams();
  const auth = useSelector((state: RootState) => state.auth);
  const isRehydrated = useSelector((state: RootState) => state._persist.rehydrated);
  const navigate = useNavigate();
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
        const raw = eligiblePreview(partner, selectedCarrier, selectedGrade);
        const preview = getPartnerBenefitPreview(partner, selectedCarrier, selectedGrade);
        return raw && preview ? [{ partner, raw, preview }] : [];
      }),
    [partners, selectedCarrier, selectedGrade]
  );
  const categories = preferredCategories.flatMap((id) => {
    const category = CATEGORIES.find((item) => item.id === id);
    return category ? [category] : [];
  });
  const extraCategories = CATEGORIES.filter(
    ({ id }) => id !== '전체' && !preferredCategories.includes(id)
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

  const topOffers = useMemo(() => {
    const hero = partnerOffers.find(({ partner }) => isCoffeeOffer(partner)) ?? partnerOffers[0];
    const sides = partnerOffers.filter((offer) => offer !== hero).slice(0, 2);
    const shelf = partnerOffers
      .filter((offer) => offer !== hero && !sides.includes(offer))
      .slice(0, 5);
    return { hero, sides, shelf };
  }, [partnerOffers]);

  const openMembership = () => {
    setMembershipOpen(true);
  };

  const applyMembership = (carrier: string, grade: string) => {
    if (!isCarrierCode(carrier) || !isValidCarrierGradePair(carrier, grade)) return;
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

  const selectedLabel = `${getCarrierLabel(selectedCarrier)} ${getMembershipGradeLabel(selectedGrade)}`;
  const selectionQuery = new URLSearchParams({
    carrier: selectedCarrier,
    grade: selectedGrade,
  }).toString();
  const selectedCategory = searchParams.get('category');

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <section className={styles.intro} aria-labelledby="home-title">
          <h1 id="home-title">어디에서 쓰고 싶으세요?</h1>
          <div className={styles.searchRow}>
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
            <div className={styles.membershipContext}>
              <span>내 멤버십 기준</span>
              <button type="button" className={focus} onClick={openMembership}>
                {selectedLabel}
                <b>변경</b>
              </button>
            </div>
          </div>
        </section>

        <nav aria-label="혜택 카테고리" className={styles.categories}>
          {categories.map(({ id, name }) => (
            <Link
              key={id}
              href={
                id === '전체'
                  ? `/benefits?${selectionQuery}`
                  : `/benefits?${selectionQuery}&category=${encodeURIComponent(id)}`
              }
              className={`${styles.category} ${focus}`}
            >
              {name}
            </Link>
          ))}
          {extraCategories.length > 0 ? (
            <label className={styles.moreCategory}>
              <span className="sr-only">다른 분야 선택</span>
              <select
                aria-label="다른 분야 선택"
                defaultValue=""
                onChange={(event) => {
                  if (event.currentTarget.value)
                    navigate(
                      `/benefits?${selectionQuery}&category=${encodeURIComponent(event.currentTarget.value)}`
                    );
                }}
              >
                <option value="">더 많은 분야</option>
                {extraCategories.map(({ id, name }) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </nav>

        <section className={styles.featureGrid} aria-label="추천 혜택">
          {topOffers.hero ? (
            <article className={styles.hero}>
              <div className={styles.heroCopy}>
                <div className={styles.brandLockup}>
                  <SafeImage
                    src={topOffers.hero.partner.image}
                    alt=""
                    width={34}
                    height={34}
                    fallbackLabel={topOffers.hero.partner.partnerName}
                    className={styles.brandLogo}
                  />
                  <strong>{topOffers.hero.partner.partnerName}</strong>
                </div>
                <p className={styles.heroEyebrow}>{selectedLabel} 멤버십</p>
                <h2>{topOffers.hero.preview.title}</h2>
                <p className={styles.heroCondition}>
                  {[topOffers.hero.preview.condition, topOffers.hero.preview.limit]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <div className={styles.heroActions}>
                  <Link
                    href={getOfferPath(topOffers.hero.partner, selectedCarrier, selectedGrade)}
                    className={`${styles.primaryButton} ${focus}`}
                  >
                    사용 방법 보기
                  </Link>
                  <OfferSaveButton
                    benefitId={topOffers.hero.raw.benefitId}
                    isSaved={favoriteIds.has(topOffers.hero.raw.benefitId)}
                    isLoggedIn={isLoggedIn}
                    isReady={isAuthReady}
                    favoritesReady={favoritesReady}
                    onChange={updateFavorite}
                    returnTo="/"
                  />
                </div>
              </div>
              {isCoffeeOffer(topOffers.hero.partner) ? (
                <div className={styles.heroPhoto}>
                  <img
                    src="/images/brand/cafe-scene.png"
                    alt="카페에서 음료와 디저트를 즐기는 장면"
                    width="428"
                    height="318"
                    fetchPriority="high"
                  />
                </div>
              ) : null}
            </article>
          ) : (
            <div className={`${styles.hero} ${styles.emptyHero}`}>
              <div>
                <h2>{isLoadError ? '혜택을 불러오지 못했어요.' : '아직 표시할 혜택이 없어요.'}</h2>
                <p>
                  {isLoadError
                    ? '잠시 후 다시 확인하거나 다른 멤버십을 선택해 주세요.'
                    : '다른 멤버십이나 전체 혜택을 살펴보세요.'}
                </p>
                <button className={styles.primaryButton} type="button" onClick={openMembership}>
                  멤버십 선택
                </button>
              </div>
            </div>
          )}
          <div className={styles.sideOffers}>
            {topOffers.sides.map(({ partner, raw, preview }) => (
              <article key={partner.partnerId} className={styles.sideOffer}>
                <SafeImage
                  src={partner.image}
                  alt=""
                  width={42}
                  height={42}
                  fallbackLabel={partner.partnerName}
                  className={styles.sideLogo}
                />
                <Link
                  href={getOfferPath(partner, selectedCarrier, selectedGrade)}
                  className={styles.sideCopy}
                >
                  <span>
                    {selectedLabel} ·{' '}
                    {CATEGORIES.find(({ id }) => id === partner.category)?.name ?? partner.category}
                  </span>
                  <strong>
                    {partner.partnerName} {preview.title}
                  </strong>
                  {preview.condition ? <small>{preview.condition}</small> : null}
                </Link>
                <OfferSaveButton
                  benefitId={raw.benefitId}
                  isSaved={favoriteIds.has(raw.benefitId)}
                  isLoggedIn={isLoggedIn}
                  isReady={isAuthReady}
                  favoritesReady={favoritesReady}
                  onChange={updateFavorite}
                  returnTo="/"
                />
              </article>
            ))}
          </div>
        </section>

        <section className={styles.shelfSection} aria-labelledby="shelf-heading">
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="shelf-heading">생활부터 주말까지</h2>
              <p>나들이와 장보기 전에 확인할 수 있는 혜택이에요.</p>
            </div>
            <Link href={`/benefits?${selectionQuery}`} className={`${styles.moreLink} ${focus}`}>
              혜택 더 보기
            </Link>
          </div>
          {topOffers.shelf.length ? (
            <div className={styles.shelf}>
              {topOffers.shelf.map(({ partner, preview }) => (
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
                    <small>{preview.limit || preview.condition || '이용 방법에서 조건 확인'}</small>
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
