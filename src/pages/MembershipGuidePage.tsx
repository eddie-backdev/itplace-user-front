import { Link } from 'react-router-dom';
import PageSeo from '../components/PageSeo';
import InfoPageShell from '../components/InfoPageShell';

import guide from '../content/membership-guide.json';

const MembershipGuidePage = () => {
  return (
    <>
      <PageSeo
        title="통신사 멤버십 혜택 이용 가이드 | 잇플레이스"
        description="SKT, KT, LG U+ 멤버십 혜택을 지도에서 찾고 온라인·오프라인 이용 조건을 확인하는 방법을 안내합니다."
        path="/guide"
      />
      <InfoPageShell
        title="통신사 멤버십 혜택 이용 가이드"
        description="멤버십 혜택은 통신사, 등급, 제휴처, 이용 채널에 따라 조건이 다릅니다. ITPLACE에서 혜택을 찾고 실제 이용 전 확인해야 할 기준을 안내합니다."
      >
        <div className="grid gap-5">
          {guide.steps.map((step) => (
            <section key={step.title} className="rounded-3xl border border-purple02 p-6">
              <h2 className="text-xl font-black tracking-[-0.02em] text-purple06">{step.title}</h2>
              <p className="mt-4 leading-7 text-grey06">{step.body}</p>
            </section>
          ))}
        </div>

        <section className="rounded-3xl bg-purple01/60 p-6">
          <h2 className="text-xl font-black tracking-[-0.02em] text-purple06">통신사별 확인 팁</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 leading-7 text-grey06">
            {guide.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl bg-grey07 p-6 text-white">
          <h2 className="text-xl font-black tracking-[-0.02em]">지금 주변 혜택을 찾아보세요</h2>
          <p className="mt-4 leading-7 text-white/85">
            지도에서 현재 위치 주변 제휴처를 확인하거나 전체 혜택 목록에서 브랜드와 카테고리별
            혜택을 비교할 수 있습니다.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/map" className="rounded-full bg-white px-5 py-2 font-bold text-grey07">
              지도에서 찾기
            </Link>
            <Link
              to="/benefits"
              className="rounded-full bg-purple03 px-5 py-2 font-bold text-white"
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
