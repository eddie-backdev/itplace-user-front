import { ReactNode } from 'react';
import SiteFooter from './SiteFooter';

type InfoPageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
};

const InfoPageShell = ({
  eyebrow = 'IT:PLACE',
  title,
  description,
  children,
}: InfoPageShellProps) => {
  return (
    <div className="min-h-screen bg-purple01/40 text-grey07">
      <article className="px-5 py-10 md:px-12 md:py-16">
        <div className="mx-auto max-w-5xl rounded-[28px] border border-purple02 bg-white px-6 py-8 shadow-[0_24px_80px_rgba(113,50,245,0.12)] md:px-12 md:py-12">
          <p className="mb-3 text-sm font-bold text-purple04">{eyebrow}</p>
          <h1 className="text-3xl font-black tracking-[-0.04em] md:text-5xl">{title}</h1>
          <p className="mt-6 max-w-3xl leading-8 text-grey06">{description}</p>
          <div className="mt-10 space-y-10">{children}</div>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
};

export default InfoPageShell;
