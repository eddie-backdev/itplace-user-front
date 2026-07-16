import PageSeo from '../components/PageSeo';
import SiteFooter from '../components/SiteFooter';
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../config/contact';

const lastUpdated = '2026년 5월 16일';

const AccountDeletionPage = () => {
  return (
    <>
      <PageSeo
        title="계정 및 데이터 삭제 안내 | 잇플레이스"
        description="ITPLACE 계정 삭제 요청 방법, 삭제되는 데이터, 보관될 수 있는 데이터와 처리 절차를 안내합니다."
        path="/account-deletion"
      />
      <article className="min-h-screen bg-purple01/40 px-5 py-10 text-grey07 md:px-12 md:py-16">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-purple02 bg-white px-6 py-8 shadow-[0_24px_80px_rgba(113,50,245,0.12)] md:px-12 md:py-12">
          <p className="mb-3 text-sm font-bold text-purple04">IT:PLACE</p>
          <h1 className="text-3xl font-black tracking-[-0.04em] md:text-5xl">
            계정 및 데이터 삭제 요청
          </h1>
          <p className="mt-4 text-sm font-bold text-grey05">시행일: {lastUpdated}</p>
          <p className="mt-6 leading-8 text-grey06">
            이 페이지는 IT:PLACE 앱 및 웹 서비스 계정과 관련 데이터의 삭제 요청 방법을 안내합니다.
            사용자는 앱 안에서 직접 회원 탈퇴를 진행하거나, 아래 이메일을 통해 계정 삭제를 요청할 수
            있습니다.
          </p>

          <section className="mt-10 rounded-3xl bg-purple01/60 p-6">
            <h2 className="text-xl font-black tracking-[-0.02em] text-purple06">
              앱에서 직접 삭제하는 방법
            </h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 leading-7 text-grey06">
              <li>IT:PLACE 앱에 로그인합니다.</li>
              <li>하단의 마이 탭으로 이동합니다.</li>
              <li>내 정보 탭에서 회원 탈퇴를 선택합니다.</li>
              <li>비밀번호를 입력한 뒤 탈퇴를 완료합니다.</li>
            </ol>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-black tracking-[-0.02em] text-purple06">
              이메일로 삭제를 요청하는 방법
            </h2>
            <p className="mt-4 leading-7 text-grey06">
              앱에 로그인할 수 없거나 직접 탈퇴가 어려운 경우 아래 이메일로 계정 삭제를 요청해
              주세요. 요청 시 가입 이메일 주소를 함께 보내주시면 본인 확인 후 처리합니다.
            </p>
            <div className="mt-5 rounded-2xl border border-purple02 p-5">
              <p className="text-sm font-bold text-grey05">계정 삭제 요청 이메일</p>
              <a
                className="mt-2 inline-block font-black text-purple04 underline"
                href={CONTACT_MAILTO}
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-black tracking-[-0.02em] text-purple06">삭제되는 데이터</h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 leading-7 text-grey06">
              <li>계정 기본 정보: 이름, 이메일, 비밀번호, 휴대폰 번호, 생년월일, 성별</li>
              <li>멤버십 정보: 통신사, 멤버십 등급, 멤버십 인증 상태</li>
              <li>앱 사용 데이터: 즐겨찾기, 저장한 혜택, 개인화 추천 관련 정보</li>
              <li>인증 정보: 로그인 세션, refresh token 등 계정 인증에 필요한 정보</li>
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-black tracking-[-0.02em] text-purple06">
              보관될 수 있는 데이터와 보관 기간
            </h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 leading-7 text-grey06">
              <li>
                법령 준수, 보안 사고 대응, 분쟁 해결을 위해 필요한 로그와 기록은 관련 법령 또는 내부
                운영 기준에 따라 필요한 기간 동안 보관될 수 있습니다.
              </li>
              <li>
                문의 내역은 고객 지원 이력 확인과 분쟁 대응을 위해 최대 3년간 보관될 수 있습니다.
              </li>
              <li>
                법령상 별도 보관 의무가 없는 데이터는 계정 삭제 처리 후 지체 없이 삭제하거나 개인을
                식별할 수 없는 형태로 처리합니다.
              </li>
            </ul>
          </section>

          <section className="mt-10 rounded-3xl bg-grey07 p-6 text-white">
            <h2 className="text-xl font-black tracking-[-0.02em]">처리 안내</h2>
            <p className="mt-4 leading-7 text-white/85">
              이메일로 접수된 계정 삭제 요청은 본인 확인 후 처리합니다. 본인 확인에 필요한 정보가
              부족한 경우 추가 확인을 요청할 수 있습니다.
            </p>
          </section>
        </div>
      </article>
      <SiteFooter />
    </>
  );
};

export default AccountDeletionPage;
