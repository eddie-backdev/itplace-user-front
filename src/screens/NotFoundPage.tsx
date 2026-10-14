import { Link } from '@/lib/navigation';
import { TbGift, TbHome, TbMapPin } from 'react-icons/tb';
import SiteFooter from '@/components/SiteFooter';
import styles from './NotFoundPage.module.css';

const NotFoundPage = () => (
  <div className={styles.page}>
    <section className={styles.content}>
      <p className={styles.eyebrow}>404 · 페이지 없음</p>
      <h1>페이지를 찾을 수 없어요</h1>
      <p className={styles.description}>
        입력한 주소에 해당하는 페이지가 없습니다. 혜택을 검색하거나 주변 매장을 찾아보세요.
      </p>
      <nav aria-label="다른 페이지로 이동" className={styles.actions}>
        <Link to="/benefits">
          <TbGift aria-hidden="true" /> 혜택 검색하기
        </Link>
        <Link to="/map">
          <TbMapPin aria-hidden="true" /> 주변 매장 찾기
        </Link>
        <Link to="/">
          <TbHome aria-hidden="true" /> 홈으로
        </Link>
      </nav>
    </section>
    <SiteFooter />
  </div>
);

export default NotFoundPage;
