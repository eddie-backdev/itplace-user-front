import { Link } from 'react-router-dom';

const footerLinks = [
  { label: '서비스 소개', to: '/about' },
  { label: '혜택 이용 가이드', to: '/guide' },
  { label: '자주 묻는 질문', to: '/faq' },
  { label: '문의', to: '/contact' },
  { label: '이용약관', to: '/terms' },
  { label: '개인정보처리방침', to: '/privacy' },
  { label: '계정 삭제 안내', to: '/account-deletion' },
];

const SiteFooter = () => {
  return (
    <footer className="border-t border-purple02 bg-white px-5 py-10 text-grey06 md:px-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-black text-purple04">IT:PLACE</p>
          <p className="mt-3 max-w-xl text-sm leading-6">
            잇플레이스는 SKT, KT, LG U+ 통신사 멤버십 제휴 혜택을 지도와 목록으로 쉽게 찾을 수
            있도록 돕는 혜택 검색 서비스입니다.
          </p>
          <p className="mt-4 text-xs text-grey04">© IT:PLACE. All rights reserved.</p>
        </div>

        <nav
          aria-label="서비스 정책 및 도움말"
          className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm"
        >
          {footerLinks.map((link) => (
            <Link key={link.to} to={link.to} className="font-bold text-grey06 hover:text-purple04">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
};

export default SiteFooter;
