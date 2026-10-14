import { Link } from '@/lib/navigation';
import styles from './SiteFooter.module.css';

const footerLinks = [
  { label: '통신사 멤버십', to: '/membership' },
  { label: '서비스 소개', to: '/about' },
  { label: '혜택 이용 가이드', to: '/guide' },
  { label: 'FAQ', to: '/faq' },
  { label: '문의', to: '/contact' },
  { label: '이용약관', to: '/terms' },
  { label: '개인정보처리방침', to: '/privacy' },
  { label: '계정 삭제', to: '/account-deletion' },
];

const currentYear = new Date().getFullYear();

const SiteFooter = () => (
  <footer className={styles.footer}>
    <div className={styles.layout}>
      <p>© {currentYear} IT:PLACE</p>
      <nav aria-label="서비스 정책 및 도움말">
        {footerLinks.map((link) => (
          <Link key={link.to} to={link.to}>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  </footer>
);

export default SiteFooter;
