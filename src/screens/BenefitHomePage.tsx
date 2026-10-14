import Link from 'next/link';
import {
  TbBook,
  TbChevronRight,
  TbCoffee,
  TbMovie,
  TbShoppingBag,
  TbTicket,
} from 'react-icons/tb';
import MobileHeader from '@/components/MobileHeader';
import HomeWelcomeHero from '@/components/HomeWelcomeHero';
import SafeImage from '@/components/SafeImage';
import SiteFooter from '@/components/SiteFooter';
import partnerCatalog from '@/data/partner-catalog.json';
import partnerNotes from '@/content/partner-notes.json';
import type { PartnerBenefitItem } from '@/features/allBenefitsPage/apis/allBenefitsApi';
import { getPartnerBenefitPreview } from '@/utils/benefitPreview';
import { getPartnerNoteForCarrier } from '@/utils/partnerNotes';
import { CARRIER_OPTIONS, type CarrierCode } from '@/utils/membership';
import { getPartnerBenefitPath } from '@/utils/partnerSeo';
import styles from './BenefitHomePage.module.css';

export type CarrierHomeSection = {
  carrier: CarrierCode;
  partners: PartnerBenefitItem[] | null;
};

const guideLinks = [
  { href: '/guide#before-payment', title: '결제 전에 확인할 네 가지' },
  { href: '/guide#discount-vs-points', title: '할인과 적립, 어떻게 다를까요?' },
  { href: '/guide#online-offline', title: '배달앱에서도 할인될까요?' },
];

const editorialSpecs = [
  {
    partnerId: 112,
    carrier: 'SKT',
    title: '1+1 상품도 멤버십 할인이 될까요?',
    description: '행사 상품은 제외될 수 있어요. 화요일 대상 프레시 푸드도 따로 확인해 보세요.',
    icon: TbShoppingBag,
  },
  {
    partnerId: 287,
    carrier: 'KT',
    title: '10% 할인받고, 스탬프도 쌓을 수 있을까요?',
    description: '대상 음료 할인과 공차 앱 스탬프 중 하나를 골라 이용할 수 있어요.',
    icon: TbCoffee,
  },
  {
    partnerId: 108,
    carrier: 'SKT',
    title: '무료 영화와 1+1, 어떻게 다를까요?',
    description: 'VIP PICK과 일반 할인은 예매 경로와 이용 조건이 달라요.',
    icon: TbMovie,
  },
] as const;

const editorialNotes = editorialSpecs.flatMap((spec) => {
  const note = getPartnerNoteForCarrier(partnerNotes, spec.partnerId, spec.carrier);
  const partner = partnerCatalog.partners.find((item) => item.partnerId === spec.partnerId);
  return note && partner ? [{ ...spec, note, partner }] : [];
});

const focusClass =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brandStrong';

export default function BenefitHomePage({
  sections,
  selectedCarrier,
}: {
  sections: CarrierHomeSection[];
  selectedCarrier: CarrierCode;
}) {
  const selectedSection = sections.find((section) => section.carrier === selectedCarrier);
  const selectedPartners = selectedSection?.partners ?? null;
  const selectedLabel = CARRIER_OPTIONS.find(({ code }) => code === selectedCarrier)?.label ?? selectedCarrier;

  return (
    <div className={styles.page}>
      <div className={styles.mobileHeader}>
        <MobileHeader title="잇플레이스" />
      </div>

      <HomeWelcomeHero />

      <div className="workspace-container">
        <section
          id="carrier-benefits"
          aria-labelledby="popular-title"
          className={styles.popularSection}
        >
          <div className={styles.sectionHeading}>
            <div>
              <div className={styles.titleWithContext}>
                <h2 id="popular-title" className={styles.sectionTitle}>
                  자주 찾는 혜택
                </h2>
                <span className={styles.sectionMeta}>
                  {selectedLabel} · 즐겨찾기 수 기준
                </span>
              </div>
            </div>
            <nav aria-label="통신사 선택" className={styles.carrierTabs}>
              {CARRIER_OPTIONS.map(({ code, label }) => {
                const selected = code === selectedCarrier;
                return (
                  <Link
                    key={code}
                    href={`/?carrier=${code}#carrier-benefits`}
                    scroll={false}
                    aria-current={selected ? 'true' : undefined}
                    className={`${styles.carrierTab} ${focusClass} ${selected ? styles.carrierTabSelected : ''}`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {selectedPartners === null ? (
            <div role="status" className={styles.emptyState}>
              <p>혜택을 불러오지 못했어요.</p>
            </div>
          ) : selectedPartners.length === 0 ? (
            <div className={styles.emptyState}>
              <p>아직 표시할 혜택이 없어요.</p>
            </div>
          ) : (
            <ul className={styles.partnerGrid}>
              {selectedPartners.map((partner) => {
                const preview = getPartnerBenefitPreview(partner, selectedCarrier);
                const detailHref = `${getPartnerBenefitPath(partner.partnerId, partner.partnerName)}?carrier=${selectedCarrier}`;

                return (
                  <li key={`${selectedCarrier}-${partner.partnerId}`} className={styles.partnerItem}>
                    <Link
                      href={detailHref}
                      className={`${styles.partnerLink} ${focusClass}`}
                    >
                      <span className="sr-only">{selectedLabel} 혜택</span>
                      <span className={styles.partnerLogo}>
                        {partner.image ? (
                          <SafeImage
                            src={partner.image}
                            alt=""
                            width={88}
                            height={88}
                            loading="lazy"
                            className="h-full w-full object-contain"
                            fallbackClassName="text-brandStrong text-[13px]"
                          />
                        ) : (
                          <TbTicket size={28} aria-hidden="true" />
                        )}
                      </span>
                      <span className={styles.partnerName}>{partner.partnerName}</span>
                      {preview ? (
                        <>
                          <span className={styles.benefitTitle}>{preview.title}</span>
                          {preview.condition ? (
                            <span className={styles.benefitCondition} title={preview.condition}>
                              {preview.condition}
                            </span>
                          ) : null}
                          <span className={styles.benefitMeta}>
                            {preview.grades}
                            {preview.limit ? ` · ${preview.limit}` : ''}
                          </span>
                        </>
                      ) : (
                        <span className={styles.benefitTitle}>혜택 조건을 상세에서 확인하세요.</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <div className={styles.allBenefitsRow}>
            <Link href={`/benefits?carrier=${selectedCarrier}`} className={styles.allBenefitsLink}>
              {selectedLabel} 전체 혜택 보기 <TbChevronRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section aria-labelledby="editorial-title" className={styles.editorialSection}>
          <div className={styles.sectionHeadingCompact}>
            <div>
              <h2 id="editorial-title" className={styles.sectionTitle}>
                혜택을 더 잘 쓰는 방법
              </h2>
            </div>
            <Link href="/guide" className={styles.allBenefitsLink}>
              이용 가이드 <TbChevronRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <ul className={styles.editorialGrid}>
            {editorialNotes.map(({ carrier, description, icon: SceneIcon, note, partner, title }) => {
              const href = `${getPartnerBenefitPath(partner.partnerId, partner.partnerName)}?carrier=${carrier}#partner-editorial-note`;

              return (
                <li key={note.partnerId}>
                  <Link href={href} className={`${styles.editorialLink} ${focusClass}`}>
                    <SceneIcon size={21} aria-hidden="true" className={styles.editorialIcon} />
                    <span className={styles.editorialCopy}>
                      <span className={styles.editorialContext}>
                        {partner.partnerName} · {carrier}
                      </span>
                      <span className={styles.editorialTitle}>{title}</span>
                      <span className={styles.editorialDescription}>{description}</span>
                    </span>
                    <TbChevronRight size={17} aria-hidden="true" className={styles.editorialArrow} />
                  </Link>
                </li>
              );
            })}
          </ul>

          <nav aria-label="혜택 이용 가이드" className={styles.guideLinks}>
            {guideLinks.map(({ href, title }) => (
              <Link key={href} href={href} className={`${styles.guideLink} ${focusClass}`}>
                <TbBook size={16} aria-hidden="true" />
                {title}
                <TbChevronRight size={16} aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </section>

        <nav aria-label="내 잇플레이스" className={styles.utilityLinks}>
          <Link href="/mypage/info" className={`${styles.utilityLink} ${focusClass}`}>
            멤버십 설정 <span>내 통신사와 등급 관리</span> <TbChevronRight size={16} aria-hidden="true" />
          </Link>
          <Link href="/mypage/activity" className={`${styles.utilityLink} ${focusClass}`}>
            혜택 사용 기록 <span>사용한 혜택과 절약액 기록</span>{' '}
            <TbChevronRight size={16} aria-hidden="true" />
          </Link>
        </nav>
      </div>

      <SiteFooter />
    </div>
  );
}
