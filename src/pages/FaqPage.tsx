import { Link } from 'react-router-dom';
import PageSeo from '../components/PageSeo';
import InfoPageShell from '../components/InfoPageShell';

import faqs from '../content/membership-faq.json';

const FaqPage = () => {
  return (
    <>
      <PageSeo
        title="자주 묻는 질문 | 잇플레이스"
        description="ITPLACE 통신사 멤버십 혜택 검색, 온라인·오프라인 혜택 구분, 지도 검색, 문의 방법에 대한 자주 묻는 질문입니다."
        path="/faq"
      />
      <InfoPageShell
        title="자주 묻는 질문"
        description="통신사 멤버십 혜택을 찾을 때 자주 생기는 질문과 ITPLACE 이용 방법을 정리했습니다."
      >
        <div className="space-y-5">
          {faqs.map((faq) => (
            <section key={faq.question} className="rounded-3xl border border-purple02 p-6">
              <h2 className="text-lg font-black tracking-[-0.02em] text-purple06">
                {faq.question}
              </h2>
              <p className="mt-3 leading-7 text-grey06">{faq.answer}</p>
            </section>
          ))}
        </div>

        <section className="rounded-3xl bg-purple01/60 p-6">
          <h2 className="text-xl font-black tracking-[-0.02em] text-purple06">
            더 자세한 이용 방법
          </h2>
          <p className="mt-4 leading-7 text-grey06">
            통신사별 혜택을 찾는 방법과 지도 검색 흐름은 혜택 이용 가이드에서 더 자세히 확인할 수
            있습니다.
          </p>
          <Link
            to="/guide"
            className="mt-5 inline-flex rounded-full bg-purple04 px-6 py-3 font-bold text-white transition hover:bg-purple05"
          >
            혜택 이용 가이드 보기
          </Link>
        </section>
      </InfoPageShell>
    </>
  );
};

export default FaqPage;
