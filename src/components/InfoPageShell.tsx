import { ReactNode } from 'react';
import { Link } from '@/lib/navigation';
import MobileHeader from './MobileHeader';
import SiteFooter from './SiteFooter';

type PageContentsLink = { id: string; label: string };
type RelatedPageLink = { label: string; to: string };

type InfoPageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  contents?: PageContentsLink[];
  relatedLinks?: RelatedPageLink[];
};

const InfoPageShell = ({
  eyebrow,
  title,
  description,
  children,
  contents,
  relatedLinks,
}: InfoPageShellProps) => {
  const navigation = (
    <>
      {contents?.length ? (
        <nav aria-label="이 페이지의 항목" className="space-y-1">
          {contents.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="flex min-h-11 items-center rounded-lg px-3 py-2 text-sm leading-5 text-grey06 hover:bg-warmCanvas hover:text-brandStrong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}
      {relatedLinks?.length ? (
        <div className="mt-4 border-t border-warmBorder pt-4">
          <h3 className="px-3 text-[13px] font-semibold text-warmMuted">관련 안내</h3>
          <nav aria-label="관련 안내" className="mt-1 space-y-1">
            {relatedLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium text-brandStrong hover:bg-brandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </>
  );

  return (
    <div className="min-h-screen bg-warmCanvas text-ink">
      <div className="h-[54px] md:hidden">
        <MobileHeader title="잇플레이스" />
      </div>
      <article className="workspace-container py-6 sm:py-8">
        <header className="surface-card p-5 sm:p-7">
          {eyebrow ? (
            <p className="mb-2 text-[13px] font-semibold text-brandStrong">{eyebrow}</p>
          ) : null}
          <h1 className="text-balance text-[24px] font-semibold leading-snug tracking-[-0.025em] sm:text-[28px]">
            {title}
          </h1>
          <p className="mt-3 max-w-[76ch] text-[15px] leading-7 text-grey06">{description}</p>
        </header>
        {contents?.length ? (
          <details className="surface-card mt-5 p-4 wide:hidden">
            <summary className="flex min-h-11 cursor-pointer items-center justify-between font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
              이 페이지에서
            </summary>
            <div className="mt-2 border-t border-warmBorder pt-2">{navigation}</div>
          </details>
        ) : null}
        <div
          className={`mt-5 ${contents?.length ? 'grid gap-5 wide:grid-cols-[minmax(0,1fr)_280px] wide:items-start' : ''}`}
        >
          <div className="min-w-0 space-y-7 [&>section>p]:max-w-[80ch]">{children}</div>
          {contents?.length ? (
            <aside className="hidden wide:block" aria-label="문서 탐색">
              <div className="surface-card sticky top-6 p-4">{navigation}</div>
            </aside>
          ) : null}
        </div>
      </article>
      <SiteFooter />
    </div>
  );
};

export default InfoPageShell;
