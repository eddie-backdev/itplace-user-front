import { Link } from '@/lib/navigation';

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

const SiteFooter = () => {
  return (
    <footer className="border-t border-warmBorder bg-warmCanvas py-5 text-warmMuted">
      <div className="workspace-container flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-5">
        <p className="shrink-0 whitespace-nowrap text-body-4 font-medium text-warmMuted">
          © {currentYear} IT:PLACE
        </p>

        <nav
          aria-label="서비스 정책 및 도움말"
          className="flex flex-wrap items-center gap-x-4 text-[13px] md:justify-end"
        >
          {footerLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="inline-flex min-h-11 items-center whitespace-nowrap rounded-sm font-medium text-warmMuted hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
};

export default SiteFooter;
