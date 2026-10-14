import { Link } from '@/lib/navigation';
import InfoPageShell from '../components/InfoPageShell';

import guide from '../content/membership-guide.json';
import { CARRIER_PAGE_CONFIGS } from '../config/membershipPages';

const MembershipGuidePage = () => {
  return (
    <>
      <InfoPageShell
        title="혜택, 이렇게 확인하세요"
        description="할인율이 높아도 행사 상품이 제외되면 실제 절약액은 작아집니다. 주문 경로, 쿠폰 중복, 남은 횟수를 확인하고 최종 결제액으로 비교해 보세요."
      >
        <nav aria-label="이용 가이드 목차" className="flex flex-wrap gap-2">
          {[
            { id: 'before-payment', label: '결제 전 확인' },
            { id: 'online-offline', label: '주문 경로 구분' },
            { id: 'discount-vs-points', label: '할인·적립 비교' },
            { id: 'when-it-fails', label: '적용되지 않을 때' },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="inline-flex min-h-11 items-center border-b border-warmBorder px-2 text-sm font-semibold text-grey06 transition-colors hover:border-brand hover:text-brandStrong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="min-w-0 divide-y divide-warmBorder">
          {guide.steps.map((step) => (
            <section key={step.id} id={step.id} className="scroll-mt-28 min-w-0 py-7">
              <h2 className="text-balance text-xl font-semibold tracking-[-0.02em] text-ink sm:text-2xl">
                {step.title}
              </h2>
              <p className="mt-4 max-w-[70ch] leading-7 text-grey06">{step.body}</p>

              {step.id === 'before-payment' ? (
                <div className="mt-5 border-l-2 border-brand pl-5">
                  <h3 className="font-bold text-brandStrong">계산대에 가기 전 체크리스트</h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-grey06">
                    {guide.beforePaymentChecks.map((check) => (
                      <li key={check}>{check}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {step.id === 'online-offline' ? (
                <dl className="mt-5 grid gap-5 sm:grid-cols-3">
                  {guide.channelExamples.map((example) => (
                    <div key={example.title} className="border-l-2 border-brand pl-4">
                      <dt className="font-bold text-ink">{example.title}</dt>
                      <dd className="mt-2 text-sm leading-6 text-grey06">{example.body}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              {step.id === 'discount-vs-points' ? (
                <div className="mt-5 border-t border-warmBorder pt-5">
                  <h3 className="text-lg font-semibold text-ink">
                    총 12,000원 주문에서 무엇이 유리할까요?
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-grey06">
                    대상 상품 8,000원, 제외 상품 4,000원이며 세 혜택 중 하나만 선택할 수 있다고
                    가정합니다. 특정 브랜드의 실제 요율·포인트 가치가 아닌 비교 방법입니다.
                  </p>
                  <div
                    role="region"
                    aria-label="가정에 따른 할인·쿠폰·적립 비교표"
                    tabIndex={0}
                    className="mt-4 overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <table className="w-full min-w-[600px] border-collapse text-left text-sm leading-6">
                      <caption className="sr-only">
                        할인액, 지금 결제할 금액, 이후 혜택 비교
                      </caption>
                      <thead>
                        <tr className="border-b border-warmBorder text-ink">
                          <th scope="col" className="py-3 pr-4">
                            선택할 혜택
                          </th>
                          <th scope="col" className="py-3 pr-4">
                            지금 할인
                          </th>
                          <th scope="col" className="py-3 pr-4">
                            결제액
                          </th>
                          <th scope="col" className="py-3">
                            판단 기준
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-grey06">
                        {guide.comparisonExamples.map((example) => (
                          <tr
                            key={example.option}
                            className="border-b border-warmBorder last:border-0"
                          >
                            <th scope="row" className="py-3 pr-4 font-bold">
                              {example.option}
                            </th>
                            <td className="whitespace-nowrap py-3 pr-4 tabular-nums">
                              {example.discount}
                            </td>
                            <td className="whitespace-nowrap py-3 pr-4 font-bold tabular-nums">
                              {example.payment}
                            </td>
                            <td className="py-3">{example.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {step.id === 'when-it-fails' ? (
                <div className="mt-5 divide-y divide-warmBorder border-y border-warmBorder">
                  {guide.troubleshooting.map((item) => (
                    <details key={item.question} className="group py-1">
                      <summary className="min-h-11 cursor-pointer py-3 font-bold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
                        {item.question}
                      </summary>
                      <p className="max-w-[70ch] pb-4 text-sm leading-7 text-grey06">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>

        <section className="border-t border-warmBorder pt-7">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink">통신사별 확인 팁</h2>
          <ul className="mt-4 max-w-[80ch] list-disc space-y-3 pl-5 leading-7 text-grey06">
            {guide.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-x-5">
            {CARRIER_PAGE_CONFIGS.map((carrier) => (
              <Link
                key={carrier.code}
                to={`/membership/${carrier.slug}`}
                className="inline-flex min-h-11 items-center rounded-md text-sm font-bold text-brandStrong underline underline-offset-4 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              >
                {carrier.name} 상세 해설과 공식 출처
              </Link>
            ))}
          </div>
        </section>

        <section className="border-t border-warmBorder pt-7">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink">
            지금 주변 혜택을 찾아보세요
          </h2>
          <p className="mt-4 leading-7 text-grey06">
            지도에서 현재 위치 주변 제휴처를 확인하거나 전체 혜택 목록에서 브랜드와 카테고리별
            혜택을 비교할 수 있습니다.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/map"
              className="inline-flex min-h-11 items-center rounded-xl bg-brand px-5 py-2 font-semibold text-white hover:bg-brandStrong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              지도에서 찾기
            </Link>
            <Link
              to="/benefits"
              className="inline-flex min-h-11 items-center rounded-xl border border-warmBorder bg-white px-5 py-2 font-semibold text-ink hover:bg-warmCanvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              전체 혜택 보기
            </Link>
          </div>
        </section>
      </InfoPageShell>
    </>
  );
};

export default MembershipGuidePage;
