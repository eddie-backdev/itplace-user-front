import PageSeo from '../components/PageSeo';
import InfoPageShell from '../components/InfoPageShell';

const termsSections = [
  {
    title: '1. 목적',
    body: '본 약관은 ITPLACE가 제공하는 통신사 멤버십 혜택 검색, 지도 기반 제휴처 탐색, 즐겨찾기, 추천 기능의 이용 조건과 절차를 안내합니다.',
  },
  {
    title: '2. 서비스 이용',
    body: '사용자는 회원가입 없이도 공개 혜택 정보를 조회할 수 있으며, 즐겨찾기, 맞춤 추천, 마이페이지 등 개인화 기능은 로그인이 필요할 수 있습니다.',
  },
  {
    title: '3. 혜택 정보의 성격',
    body: 'ITPLACE는 통신사 멤버십 혜택과 제휴처 정보를 쉽게 찾을 수 있도록 정리해 제공하지만, 혜택 조건과 운영 여부는 통신사 또는 제휴처 정책에 따라 변경될 수 있습니다. 실제 이용 전 최신 조건을 확인해 주세요.',
  },
  {
    title: '4. 이용자의 의무',
    body: '이용자는 타인의 계정을 무단으로 사용하거나, 서비스 운영을 방해하거나, 허위 문의·자동화된 대량 요청 등 정상적인 이용 범위를 벗어난 행위를 해서는 안 됩니다.',
  },
  {
    title: '5. 계정과 데이터',
    body: '회원은 마이페이지 또는 계정 삭제 안내 절차를 통해 계정 삭제를 요청할 수 있습니다. 개인정보 처리 기준은 개인정보처리방침을 따릅니다.',
  },
  {
    title: '6. 문의와 정보 정정',
    body: '혜택 정보 오류, 제휴 문의, 서비스 이용 문의는 문의 페이지 또는 앱 내 문의 기능을 통해 접수할 수 있습니다.',
  },
];

const TermsPage = () => {
  return (
    <>
      <PageSeo
        title="이용약관 | 잇플레이스"
        description="ITPLACE 통신사 멤버십 혜택 검색 서비스의 이용 조건, 혜택 정보 안내 기준, 계정 및 문의 절차를 안내합니다."
        path="/terms"
      />
      <InfoPageShell
        title="이용약관"
        description="본 약관은 ITPLACE 웹 및 모바일 서비스 이용에 필요한 기본 기준을 설명합니다."
      >
        <p className="text-sm font-bold text-grey05">시행일: 2026년 6월 27일</p>
        {termsSections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-black tracking-[-0.02em] text-purple06">{section.title}</h2>
            <p className="mt-4 leading-7 text-grey06">{section.body}</p>
          </section>
        ))}
      </InfoPageShell>
    </>
  );
};

export default TermsPage;
