import PageSeo from '../components/PageSeo';
import SiteFooter from '../components/SiteFooter';
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../config/contact';

import policy from '../content/privacy-policy.json';

const PrivacyPolicyPage = () => {
  return (
    <>
      <PageSeo
        title="개인정보처리방침 | 잇플레이스"
        description="ITPLACE 웹 및 모바일 서비스의 개인정보 수집, 이용 목적, 위치정보 처리, 보관 및 파기, 이용자 권리를 안내합니다."
        path="/privacy"
      />
      <article className="min-h-screen bg-purple01/40 px-5 py-10 text-grey07 md:px-12 md:py-16">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-purple02 bg-white px-6 py-8 shadow-[0_24px_80px_rgba(113,50,245,0.12)] md:px-12 md:py-12">
          <p className="mb-3 text-sm font-bold text-purple04">IT:PLACE</p>
          <h1 className="text-3xl font-black tracking-[-0.04em] md:text-5xl">개인정보처리방침</h1>
          <p className="mt-4 text-sm font-bold text-grey05">시행일: {policy.updatedAt}</p>
          <p className="mt-6 leading-8 text-grey06">{policy.introduction}</p>

          <div className="mt-10 space-y-10">
            {policy.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-black tracking-[-0.02em] text-purple06">
                  {section.title}
                </h2>
                <ul className="mt-4 list-disc space-y-3 pl-5 leading-7 text-grey06">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {section.links.length > 0 ? (
                  <ul className="mt-4 space-y-3 text-sm leading-6">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-purple04 underline underline-offset-4"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <section className="mt-10 rounded-3xl bg-purple01/60 p-6">
            <h2 className="text-xl font-black tracking-[-0.02em] text-purple06">11. 문의</h2>
            <p className="mt-4 leading-7 text-grey06">
              개인정보 처리와 관련한 문의는 앱 내 문의 기능 또는 아래 이메일로 접수할 수 있습니다.
            </p>
            <dl className="mt-5 grid gap-3 text-sm md:grid-cols-[120px_1fr]">
              <dt className="font-bold text-grey05">서비스명</dt>
              <dd className="font-bold text-grey07">IT:PLACE</dd>
              <dt className="font-bold text-grey05">문의 이메일</dt>
              <dd>
                <a className="font-bold text-purple04 underline" href={CONTACT_MAILTO}>
                  {CONTACT_EMAIL}
                </a>
              </dd>
            </dl>
          </section>
        </div>
      </article>
      <SiteFooter />
    </>
  );
};

export default PrivacyPolicyPage;
