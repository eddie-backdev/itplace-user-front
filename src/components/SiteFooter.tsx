import { Link } from 'react-router-dom';

const footerLinks = [
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
    <footer className="border-t border-grey02 bg-grey01/60 px-5 py-3 text-grey05 md:px-12">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-3 md:flex-row md:justify-between md:gap-5">
        <p className="shrink-0 whitespace-nowrap text-body-4 font-medium text-grey04">
          © {currentYear} IT:PLACE
        </p>

        <nav
          aria-label="서비스 정책 및 도움말"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-body-4 md:justify-end"
        >
          {footerLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="whitespace-nowrap font-medium text-grey05 transition-colors hover:text-purple04 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
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
