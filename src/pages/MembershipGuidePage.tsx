import { Link } from 'react-router-dom';
import PageSeo from '../components/PageSeo';
import InfoPageShell from '../components/InfoPageShell';

const guideSteps = [
  {
    title: '1. 통신사와 멤버십 조건을 확인합니다',
    body: 'SKT, KT, LG U+ 멤버십은 등급, 월별 한도, 제휴처 정책에 따라 적용 조건이 달라질 수 있습니다. 내 통신사와 멤버십 등급을 먼저 확인하면 검색 결과를 더 정확히 이해할 수 있습니다.',
  },
  {
    title: '2. 지도에서 주변 제휴처를 탐색합니다',
    body: '현재 위치 또는 원하는 지역을 기준으로 주변 음식점, 카페, 문화, 쇼핑 제휴처를 확인합니다. 지도 이동 후 현 지도에서 검색하면 해당 영역의 혜택을 다시 조회할 수 있습니다.',
  },
  {
    title: '3. 온라인·오프라인 이용 조건을 구분합니다',
    body: '같은 브랜드라도 온라인 주문, 앱 결제, 현장 결제, 특정 매장 방문 여부에 따라 혜택이 달라질 수 있습니다. 혜택 상세에서 이용 채널과 조건을 함께 확인하세요.',
  },
  {
    title: '4. 실제 결제 전 최신 조건을 재확인합니다',
    body: '통신사 멤버십 혜택은 기간, 재고, 제휴처 운영 정책에 따라 변경될 수 있습니다. 매장 방문이나 결제 전 통신사 앱 또는 제휴처 안내를 한 번 더 확인하는 것이 안전합니다.',
  },
];

const carrierTips = [
  'SKT T 멤버십은 제휴처별 할인율, 적립, VIP Pick 등 조건이 다를 수 있습니다.',
  'KT 멤버십은 등급별 제공 횟수와 월별 이용 한도를 확인하는 것이 중요합니다.',
  'LG U+ 멤버십은 라이프스타일 제휴와 온라인 이용 조건이 함께 제공되는 경우가 있습니다.',
];

const MembershipGuidePage = () => {
  return (
    <>
      <PageSeo
        title="통신사 멤버십 혜택 이용 가이드 | ITPLACE"
        description="SKT, KT, LG U+ 멤버십 혜택을 지도에서 찾고 온라인·오프라인 이용 조건을 확인하는 방법을 안내합니다."
        path="/guide"
      />
      <InfoPageShell
        title="통신사 멤버십 혜택 이용 가이드"
        description="멤버십 혜택은 통신사, 등급, 제휴처, 이용 채널에 따라 조건이 다릅니다. ITPLACE에서 혜택을 찾고 실제 이용 전 확인해야 할 기준을 안내합니다."
      >
        <div className="grid gap-5">
          {guideSteps.map((step) => (
            <section key={step.title} className="rounded-3xl border border-purple02 p-6">
              <h2 className="text-xl font-black tracking-[-0.02em] text-purple06">{step.title}</h2>
              <p className="mt-4 leading-7 text-grey06">{step.body}</p>
            </section>
          ))}
        </div>

        <section className="rounded-3xl bg-purple01/60 p-6">
          <h2 className="text-xl font-black tracking-[-0.02em] text-purple06">통신사별 확인 팁</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 leading-7 text-grey06">
            {carrierTips.map((tip) => (
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
