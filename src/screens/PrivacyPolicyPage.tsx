import InfoPageShell from '../components/InfoPageShell';
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../config/contact';

import policy from '../content/privacy-policy.json';

const PrivacyPolicyPage = () => {
  return (
    <>
      <InfoPageShell
        title="개인정보처리방침"
        description={policy.introduction}
        contents={[
          ...policy.sections.map((section, index) => ({
            id: `privacy-section-${index + 1}`,
            label: section.title,
          })),
          { id: 'privacy-contact', label: '11. 문의' },
        ]}
        relatedLinks={[
          { label: '이용약관', to: '/terms' },
          { label: '계정 삭제 안내', to: '/account-deletion' },
          { label: '문의', to: '/contact' },
        ]}
      >
        <div className="max-w-[820px] wide:max-w-none">
          <p className="text-sm font-medium text-warmMuted">시행일: {policy.updatedAt}</p>

          <div className="mt-7 space-y-8">
            {policy.sections.map((section, index) => (
              <section
                key={section.title}
                id={`privacy-section-${index + 1}`}
                className="surface-card scroll-mt-6 p-5 sm:p-7"
              >
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink sm:text-xl">
                  {section.title}
                </h2>
                <ul className="mt-3 max-w-[80ch] list-disc space-y-3 pl-5 text-[15px] leading-7 text-grey06">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {section.links.length > 0 ? (
                  <ul className="mt-4 max-w-[80ch] space-y-3 text-[15px] leading-6">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-11 items-center rounded-md font-medium text-brandStrong underline underline-offset-4 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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

          <section id="privacy-contact" className="surface-card scroll-mt-6 mt-8 p-5 sm:p-7">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink sm:text-xl">
              11. 문의
            </h2>
            <p className="mt-3 max-w-[80ch] text-[15px] leading-7 text-grey06">
              개인정보 처리와 관련한 문의는 앱 내 문의 기능 또는 아래 이메일로 접수할 수 있습니다.
            </p>
            <dl className="mt-5 grid gap-3 text-[15px] md:grid-cols-[120px_1fr]">
              <dt className="font-bold text-grey05">서비스명</dt>
              <dd className="font-semibold text-ink">IT:PLACE</dd>
              <dt className="font-bold text-grey05">문의 이메일</dt>
              <dd>
                <a
                  className="inline-flex min-h-11 items-center rounded-md font-medium text-brandStrong underline underline-offset-4 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  href={CONTACT_MAILTO}
                >
                  {CONTACT_EMAIL}
                </a>
              </dd>
            </dl>
          </section>
        </div>
      </InfoPageShell>
    </>
  );
};

export default PrivacyPolicyPage;
