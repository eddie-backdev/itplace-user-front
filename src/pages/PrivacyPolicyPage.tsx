import PageSeo from '../components/PageSeo';
import SiteFooter from '../components/SiteFooter';
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../config/contact';

const lastUpdated = '2026년 5월 15일';

const sections = [
  {
    title: '1. 수집하는 개인정보',
    items: [
      '회원가입 및 계정 관리를 위해 이름, 이메일, 비밀번호, 휴대폰 번호, 생년월일, 성별을 수집합니다.',
      '맞춤 혜택 제공을 위해 통신사, 멤버십 등급, 즐겨찾기, 혜택 조회·이용 관련 정보를 수집할 수 있습니다.',
      '휴대폰 번호 인증을 위해 사용자가 입력한 휴대폰 번호와 인증 처리 결과를 수집합니다.',
      '문의 접수를 위해 문의 유형, 제목, 내용, 처리 상태를 수집합니다.',
      '주변 혜택과 매장 정보를 제공하기 위해 사용자가 권한을 허용한 경우 기기의 위치정보를 이용할 수 있습니다.',
      '서비스 보안과 장애 대응을 위해 접속 로그, 기기 정보, 오류 로그, 쿠키 또는 세션 정보를 처리할 수 있습니다.',
    ],
  },
  {
    title: '2. 개인정보 이용 목적',
    items: [
      '회원 식별, 로그인, 계정 관리, 비밀번호 재설정 등 인증 기능 제공',
      '휴대폰 번호 점유 인증 및 부정 가입 방지',
      '사용자의 통신사와 멤버십 등급에 맞는 혜택 추천 및 검색 결과 제공',
      '현재 위치 주변의 혜택, 제휴처, 매장 정보 제공',
      '즐겨찾기, 저장 목록, 이용 내역 등 개인화 기능 제공',
      '문의 접수, 고객 지원, 오류 확인 및 서비스 개선',
      '보안 사고 예방, 서비스 안정성 확보, 법령상 의무 이행',
    ],
  },
  {
    title: '3. 위치정보 처리',
    items: [
      'IT:PLACE는 사용자가 위치 권한을 허용한 경우에만 현재 위치를 이용해 주변 혜택과 매장 정보를 조회합니다.',
      '위치 권한을 거부해도 앱의 기본 기능은 사용할 수 있으나, 현재 위치 기반 주변 혜택 기능은 제한될 수 있습니다.',
      '정확한 위치정보는 주변 혜택 조회 요청 처리에 사용되며, 별도 고지 없이 광고 추적 목적으로 사용하지 않습니다.',
    ],
  },
  {
    title: '4. 제3자 서비스 및 처리 위탁',
    items: [
      '카카오 로그인 사용 시 카카오에서 제공하는 OAuth 인증 정보가 처리될 수 있습니다.',
      '휴대폰 문자 인증을 위해 Octomo(Octoverse)의 문자 수신 여부 조회 API를 사용할 수 있으며, 이 과정에서 휴대폰 번호와 인증 문자열이 전송될 수 있습니다.',
      '지도, 위치, 길찾기 등 외부 서비스로 이동하는 기능을 사용하는 경우 해당 서비스의 개인정보 처리방침이 추가로 적용될 수 있습니다.',
      '서비스 운영 과정에서 클라우드 인프라, 데이터베이스, 로그 관리 도구 등 안정적인 서비스 제공에 필요한 처리 시스템을 사용할 수 있습니다.',
    ],
  },
  {
    title: '5. 개인정보 보관 및 파기',
    items: [
      '회원 정보는 회원 탈퇴 시 지체 없이 파기하는 것을 원칙으로 합니다.',
      '관계 법령에 따라 보관이 필요한 정보는 해당 법령에서 정한 기간 동안 보관한 후 파기합니다.',
      '문자 인증을 위해 발급된 인증 문자열은 제한된 시간 동안만 보관되며, 인증 완료 또는 만료 후 삭제됩니다.',
      '문의 및 고객 지원 기록은 분쟁 대응과 서비스 품질 관리를 위해 필요한 기간 동안 보관할 수 있습니다.',
    ],
  },
  {
    title: '6. 이용자의 권리',
    items: [
      '이용자는 본인의 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다.',
      '앱의 마이페이지에서 계정 정보, 멤버십 정보, 비밀번호 변경, 회원 탈퇴 기능을 이용할 수 있습니다.',
      '위치 권한은 기기 설정에서 언제든지 허용 또는 거부할 수 있습니다.',
      '권리 행사는 앱 내 문의 기능 또는 아래 연락처를 통해 요청할 수 있습니다.',
    ],
  },
  {
    title: '7. 개인정보 보호 조치',
    items: [
      '비밀번호는 복호화할 수 없는 방식으로 안전하게 저장합니다.',
      '인증과 세션 관리를 위해 필요한 보안 조치를 적용합니다.',
      '개인정보 접근 권한을 필요한 범위로 제한하고, 서비스 장애와 보안 이슈에 대응하기 위한 로그를 관리합니다.',
      '개발 및 운영 과정에서 개인정보가 불필요하게 노출되지 않도록 점검합니다.',
    ],
  },
  {
    title: '8. 아동의 개인정보',
    items: [
      'IT:PLACE는 아동을 주된 대상으로 하는 서비스가 아닙니다.',
      '관련 법령상 법정대리인의 동의가 필요한 아동의 개인정보를 수집해야 하는 경우에는 법령에서 정한 절차를 따릅니다.',
    ],
  },
  {
    title: '9. 개인정보처리방침 변경',
    items: [
      '본 개인정보처리방침은 서비스 변경, 법령 개정, 운영 정책 변경에 따라 수정될 수 있습니다.',
      '중요한 변경이 있는 경우 앱 또는 웹사이트를 통해 공지합니다.',
    ],
  },
];

const PrivacyPolicyPage = () => {
  return (
    <>
      <PageSeo
        title="개인정보처리방침 | ITPLACE"
        description="ITPLACE 웹 및 모바일 서비스의 개인정보 수집, 이용 목적, 위치정보 처리, 보관 및 파기, 이용자 권리를 안내합니다."
        path="/privacy"
      />
      <article className="min-h-screen bg-purple01/40 px-5 py-10 text-grey07 md:px-12 md:py-16">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-purple02 bg-white px-6 py-8 shadow-[0_24px_80px_rgba(113,50,245,0.12)] md:px-12 md:py-12">
          <p className="mb-3 text-sm font-bold text-purple04">IT:PLACE</p>
          <h1 className="text-3xl font-black tracking-[-0.04em] md:text-5xl">개인정보처리방침</h1>
          <p className="mt-4 text-sm font-bold text-grey05">시행일: {lastUpdated}</p>
          <p className="mt-6 leading-8 text-grey06">
            IT:PLACE는 이용자의 개인정보를 중요하게 생각하며, 개인정보 보호 관련 법령을 준수하기
            위해 다음과 같이 개인정보 처리방침을 공개합니다. 본 방침은 IT:PLACE 웹 및 모바일 앱
            서비스에 적용됩니다.
          </p>

          <div className="mt-10 space-y-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-black tracking-[-0.02em] text-purple06">
                  {section.title}
                </h2>
                <ul className="mt-4 list-disc space-y-3 pl-5 leading-7 text-grey06">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <section className="mt-10 rounded-3xl bg-purple01/60 p-6">
            <h2 className="text-xl font-black tracking-[-0.02em] text-purple06">10. 문의</h2>
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
