import { Link } from '@/lib/navigation';
import { TbChevronDown } from 'react-icons/tb';
import InfoPageShell from '../components/InfoPageShell';

import faqs from '../content/membership-faq.json';

const faqGroups = [
  { title: '혜택 조건과 이용', items: [0, 1, 8, 10].map((index) => faqs[index]) },
  { title: '지도와 정보 확인', items: [2, 3, 4, 9].map((index) => faqs[index]) },
  { title: '계정과 사용 기록', items: [5, 6, 7].map((index) => faqs[index]) },
];

const FaqPage = () => {
  return (
    <InfoPageShell
      title="자주 묻는 질문"
      description="통신사 멤버십 혜택을 찾을 때 자주 생기는 질문과 ITPLACE 이용 방법을 정리했습니다."
    >
      <section aria-labelledby="faq-list-title">
        <h2 id="faq-list-title" className="sr-only">
          질문 유형별로 찾아보기
        </h2>
        <div>
          {faqGroups.map((group) => (
            <section key={group.title} className="border-b border-warmBorder pb-6">
              <h3 className="pb-3 pt-6 text-[15px] font-semibold text-brandStrong">
                {group.title}
              </h3>
              <div className="divide-y divide-warmBorder">
                {group.items.map((faq) => (
                  <details key={faq.question} className="group">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold leading-6 text-ink hover:text-brandStrong focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                      {faq.question}
                      <TbChevronDown
                        className="h-5 w-5 shrink-0 text-grey05 transition-transform group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </summary>
                    <p className="max-w-[78ch] pb-5 pr-8 text-[14px] leading-7 text-grey06">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="border-t border-warmBorder pt-6">
        <h2 className="text-lg font-bold tracking-[-0.02em]">더 자세한 이용 방법</h2>
        <p className="mt-2 max-w-[70ch] text-[15px] leading-7 text-grey06">
          통신사별 혜택을 찾는 방법과 지도 검색 흐름은 혜택 이용 가이드에서 더 자세히 확인할 수
          있습니다.
        </p>
        <Link
          to="/guide"
          className="mt-4 inline-flex min-h-11 items-center font-semibold text-brandStrong underline underline-offset-4 transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          혜택 이용 가이드 보기
        </Link>
      </section>
    </InfoPageShell>
  );
};

export default FaqPage;
