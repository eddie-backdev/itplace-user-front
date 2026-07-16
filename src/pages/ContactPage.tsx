import { Link } from 'react-router-dom';
import PageSeo from '../components/PageSeo';
import InfoPageShell from '../components/InfoPageShell';
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../config/contact';

const inquiryTypes = [
  '혜택 정보 수정 또는 누락 제보',
  '서비스 오류 신고',
  '제휴 및 광고 관련 문의',
  '개인정보 또는 계정 삭제 요청',
];

const ContactPage = () => {
  return (
    <>
      <PageSeo
        title="문의 | 잇플레이스"
        description="ITPLACE 서비스 오류, 혜택 정보 수정, 제휴 문의, 개인정보 관련 문의 접수 방법을 안내합니다."
        path="/contact"
      />
      <InfoPageShell
        title="문의"
        description="ITPLACE 이용 중 발견한 오류, 혜택 정보 변경 사항, 제휴 제안, 개인정보 관련 요청은 아래 방법으로 접수할 수 있습니다."
      >
        <section className="rounded-3xl bg-purple01/60 p-6">
          <h2 className="text-xl font-black tracking-[-0.02em] text-purple06">문의 가능한 내용</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 leading-7 text-grey06">
            {inquiryTypes.map((type) => (
              <li key={type}>{type}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black tracking-[-0.02em] text-purple06">접수 방법</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-purple02 p-5">
              <p className="text-sm font-bold text-grey05">앱/웹 문의</p>
              <p className="mt-3 leading-7 text-grey06">
                로그인 후 사이드 메뉴의 문의 기능을 이용하면 문의 유형과 내용을 함께 접수할 수
                있습니다.
              </p>
            </div>
            <div className="rounded-2xl border border-purple02 p-5">
              <p className="text-sm font-bold text-grey05">이메일 문의</p>
              <a
                className="mt-3 inline-block font-black text-purple04 underline"
                href={CONTACT_MAILTO}
              >
                {CONTACT_EMAIL}
              </a>
              <p className="mt-3 text-sm leading-6 text-grey05">
                문의 시 오류 화면, 제휴처명, 통신사, 혜택 조건을 함께 적어주시면 확인이 빨라집니다.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-grey07 p-6 text-white">
          <h2 className="text-xl font-black tracking-[-0.02em]">개인정보 관련 요청</h2>
          <p className="mt-4 leading-7 text-white/85">
            개인정보 열람, 정정, 삭제, 계정 삭제 요청은 개인정보처리방침과 계정 삭제 안내를 함께
            확인해 주세요.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/privacy" className="rounded-full bg-white px-5 py-2 font-bold text-grey07">
              개인정보처리방침
            </Link>
            <Link
              to="/account-deletion"
              className="rounded-full bg-purple03 px-5 py-2 font-bold text-white"
            >
              계정 삭제 안내
            </Link>
          </div>
        </section>
      </InfoPageShell>
    </>
  );
};

export default ContactPage;
