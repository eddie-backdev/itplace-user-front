import Image from 'next/image';
import Link from 'next/link';
import { TbMapPin, TbSearch } from 'react-icons/tb';
import styles from '@/screens/BenefitHomePage.module.css';

const focusClass =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-warmSurface focus-visible:ring-brandStrong';

export default function HomeWelcomeHero() {
  return (
    <header className="workspace-container">
      <form action="/benefits" method="get" role="search" className={styles.searchStrip}>
        <label htmlFor="home-benefit-search" className="sr-only">
          혜택 검색
        </label>
        <TbSearch aria-hidden="true" size={18} className={styles.searchIcon} />
        <input
          id="home-benefit-search"
          name="q"
          type="search"
          autoComplete="off"
          maxLength={100}
          placeholder="브랜드나 혜택 검색…"
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchButton}>
          검색
        </button>
      </form>

      <section aria-labelledby="home-hero-title" className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1 id="home-hero-title" className={styles.heroTitle}>
            커피 한 잔도,
            <br />
            영화 한 편도.
          </h1>
          <p className={styles.heroDescription}>
            SKT·KT·LG U+ 멤버십 혜택을 한곳에서.
          </p>
          <div className={styles.heroActions}>
            <Link href="/benefits" className={`${styles.primaryAction} ${focusClass}`}>
              혜택 둘러보기
            </Link>
            <Link href="/map" className={`${styles.secondaryAction} ${focusClass}`}>
              <TbMapPin size={17} aria-hidden="true" />
              내 주변 매장
            </Link>
          </div>
        </div>
        <div className={styles.heroPhoto} aria-hidden="true">
          <Image
            src="/images/home/everyday-benefits-hero.webp"
            alt=""
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(max-width: 767px) calc(100vw - 40px), (min-width: 1600px) calc((100vw - 372px) * 0.55), calc((100vw - 340px) * 0.55)"
            className={styles.heroImage}
          />
        </div>
      </section>
    </header>
  );
}
