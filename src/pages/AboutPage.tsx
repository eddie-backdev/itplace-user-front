import { Link } from 'react-router-dom';
import { TbBook2, TbFileText, TbHelpCircle, TbMail, TbShieldLock } from 'react-icons/tb';
import PageSeo from '../components/PageSeo';
import InfoPageShell from '../components/InfoPageShell';

const servicePoints = [
  '통신사 멤버십 제휴처를 지도와 목록에서 한 번에 탐색합니다.',
  '온라인과 오프라인 혜택 조건, 이용 채널, 멤버십 등급별 혜택을 구분해 안내합니다.',
  '현재 위치 또는 검색 위치 주변에서 사용할 수 있는 할인 정보를 빠르게 확인할 수 있습니다.',
  '저장 기능과 맞춤 추천 기능으로 자주 쓰는 혜택을 다시 찾기 쉽게 관리합니다.',
];

const guideLinks = [
  {
    label: '가이드',
    description: '지도와 검색으로 멤버십 혜택을 찾는 방법을 확인합니다.',
    to: '/guide',
    icon: TbBook2,
  },
  {
    label: 'FAQ',
    description: '자주 묻는 질문과 혜택 정보 확인 기준을 살펴봅니다.',
    to: '/faq',
    icon: TbHelpCircle,
  },
  {
    label: '문의',
    description: '오류 신고, 혜택 정보 수정, 제휴 문의를 접수합니다.',
    to: '/contact',
    icon: TbMail,
  },
  {
    label: '약관',
    description: '서비스 이용 기준과 계정 관련 절차를 확인합니다.',
    to: '/terms',
    icon: TbFileText,
  },
  {
    label: '개인정보',
    description: '개인정보 수집, 이용, 보관, 권리 행사 기준을 확인합니다.',
    to: '/privacy',
    icon: TbShieldLock,
  },
];

const dataPrinciples = [
  '혜택 정보는 제휴처, 통신사, 멤버십 등급, 이용 조건, 온라인·오프라인 적용 여부를 기준으로 정리합니다.',
  '조건이 변경될 수 있는 멤버십 혜택 특성상 실제 결제 전 통신사 또는 제휴처의 최신 안내를 함께 확인하는 것을 권장합니다.',
  '잘못된 혜택 정보나 누락된 제휴처는 문의 기능을 통해 접수받고 확인 후 개선합니다.',
];

const AboutPage = () => {
  return (
    <>
      <PageSeo
        title="서비스 소개 | ITPLACE"
        description="ITPLACE는 SKT, KT, LG U+ 통신사 멤버십 혜택과 제휴처를 지도 기반으로 찾을 수 있는 혜택 검색 서비스입니다."
        path="/about"
      />
      <InfoPageShell
        title="서비스 소개"
        description="ITPLACE는 흩어져 있는 통신 3사 멤버십 혜택을 사용자가 실제로 찾고 비교할 수 있도록 지도, 목록, 검색, 추천 기능으로 정리하는 서비스입니다."
      >
        <section>
          <h2 className="text-xl font-black tracking-[-0.02em] text-purple06">안내 바로가기</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {guideLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group rounded-2xl border border-grey02 bg-white p-4 transition hover:-translate-y-0.5 hover:border-purple02 hover:shadow-[0_10px_24px_rgba(113,50,245,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple01 text-purple05">
                      <Icon size={21} strokeWidth={1.8} />
                    </span>
                    <span className="text-title-7 font-black text-grey06 group-hover:text-purple05">
                      {item.label}
                    </span>
                  </div>
                  <p className="mt-3 text-body-4 leading-6 text-grey05">{item.description}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black tracking-[-0.02em] text-purple06">
            무엇을 제공하나요?
          </h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 leading-7 text-grey06">
            {servicePoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl bg-purple01/60 p-6">
          <h2 className="text-xl font-black tracking-[-0.02em] text-purple06">
            누구에게 유용한가요?
          </h2>
          <p className="mt-4 leading-7 text-grey06">
            통신사 멤버십을 보유하고 있지만 어떤 매장에서 어떤 혜택을 받을 수 있는지 매번 확인하기
            어려운 사용자, 주변에서 바로 사용할 수 있는 할인 정보를 찾는 사용자, 온라인과 오프라인
            혜택 조건을 구분해 보고 싶은 사용자에게 유용합니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black tracking-[-0.02em] text-purple06">정보 운영 기준</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 leading-7 text-grey06">
            {dataPrinciples.map((principle) => (
              <li key={principle}>{principle}</li>
            ))}
          </ul>
        </section>
      </InfoPageShell>
    </>
  );
};

export default AboutPage;
