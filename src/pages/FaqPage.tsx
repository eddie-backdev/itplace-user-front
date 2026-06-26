import { Link } from 'react-router-dom';
import PageSeo from '../components/PageSeo';
import InfoPageShell from '../components/InfoPageShell';

const faqs = [
  {
    question: 'ITPLACE에서 어떤 혜택을 찾을 수 있나요?',
    answer:
      'SKT, KT, LG U+ 통신사 멤버십으로 이용할 수 있는 제휴처 할인, 무료 제공, 등급별 혜택, 온라인·오프라인 이용 조건을 검색할 수 있습니다.',
  },
  {
    question: '온라인 혜택과 오프라인 혜택은 어떻게 구분하나요?',
    answer:
      '혜택 상세에서 이용 채널과 조건을 확인할 수 있도록 정리합니다. 오프라인 매장 이용 혜택은 지도와 매장 정보 중심으로, 온라인 혜택은 적용 링크나 이용 조건 중심으로 확인하는 방식입니다.',
  },
  {
    question: '지도에 보이는 매장은 어떻게 찾나요?',
    answer:
      '현재 위치 또는 검색 위치를 기준으로 주변 제휴처를 조회합니다. 카테고리, 키워드, 통신사 조건을 조합해 원하는 혜택을 좁혀볼 수 있습니다.',
  },
  {
    question: '혜택 정보가 실제와 다를 수 있나요?',
    answer:
      '통신사와 제휴처 정책은 수시로 바뀔 수 있습니다. ITPLACE는 정보 정확도를 높이기 위해 데이터를 정리하지만, 실제 결제 전 통신사 또는 제휴처의 최신 안내를 확인하는 것을 권장합니다.',
  },
  {
    question: '잘못된 혜택 정보는 어떻게 제보하나요?',
    answer:
      '문의 페이지 또는 앱 내 문의 기능으로 제휴처명, 통신사, 잘못된 조건, 확인한 위치를 알려주시면 검토 후 반영합니다.',
  },
  {
    question: '회원가입 없이도 사용할 수 있나요?',
    answer:
      '공개 혜택 조회와 지도 검색은 기본적으로 이용할 수 있습니다. 즐겨찾기, 맞춤 추천, 마이페이지 등 개인화 기능은 로그인이 필요할 수 있습니다.',
  },
];

const FaqPage = () => {
  return (
    <>
      <PageSeo
        title="자주 묻는 질문 | ITPLACE"
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
