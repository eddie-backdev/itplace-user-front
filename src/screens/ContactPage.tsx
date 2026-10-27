import { Link } from '@/lib/navigation';
import InfoPageShell from '../components/InfoPageShell';
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../config/contact';

const inquiryTypes = [
  {
    label: '혜택 정보 수정·누락 제보',
    subject: '[혜택 정보 제보]',
    description: '제휴처명, 통신사, 잘못된 조건과 확인한 위치를 알려주세요.',
  },
  {
    label: '서비스 오류 문의',
    subject: '[서비스 오류 문의]',
    description: '문제가 나타난 화면과 사용한 기기·브라우저를 적어주세요.',
  },
  {
    label: '제휴 제안',
    subject: '[제휴 문의]',
    description: '제휴 내용과 회신받을 연락처를 보내주세요.',
  },
  {
    label: '개인정보·계정 관련 문의',
    subject: '[개인정보·계정 문의]',
    description: '개인정보 요청이나 계정 삭제 방법을 문의할 수 있어요.',
  },
];

const getContactHref = (subject: string) =>
  `${CONTACT_MAILTO}?subject=${encodeURIComponent(subject)}`;

const ContactPage = () => {
  return (
    <InfoPageShell
      title="문의"
      description="혜택 정보 정정, 서비스 오류, 제휴 제안과 개인정보 관련 문의를 이메일로 받고 있어요."
    >
      <section aria-labelledby="contact-actions-title">
        <h2 id="contact-actions-title" className="sr-only">
          문의 유형
        </h2>
        <div className="divide-y divide-warmBorder border-y border-warmBorder">
          {inquiryTypes.map(({ label, subject, description }) => (
            <a
              key={subject}
              href={getContactHref(subject)}
              className="grid gap-1 py-5 hover:text-accentStrong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:grid-cols-[200px_1fr] md:gap-6"
            >
              <span className="font-semibold text-ink">{label}</span>
              <span className="text-[14px] leading-6 text-grey06">{description}</span>
            </a>
          ))}
        </div>
        <p className="mt-5 text-sm leading-6 text-grey06">
          항목을 선택하면 메일 앱에서 제목이 채워집니다. 내용을 확인한 뒤 직접 보내주세요.{' '}
          <a
            href={CONTACT_MAILTO}
            className="font-medium text-accentStrong underline underline-offset-4"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </section>

      <section aria-labelledby="privacy-help-title" className="border-t border-warmBorder pt-6">
        <h2
          id="privacy-help-title"
          className="text-xl font-semibold tracking-[-0.02em] sm:text-2xl"
        >
          개인정보와 계정
        </h2>
        <p className="mt-2 max-w-[70ch] text-[15px] leading-7 text-grey06">
          열람·정정·삭제 요청은 이메일로 보내주세요. 계정 삭제 절차와 개인정보 처리 기준도 확인할 수
          있습니다.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
          <Link
            to="/privacy"
            className="inline-flex min-h-11 items-center font-semibold text-accentStrong underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            개인정보처리방침
          </Link>
          <Link
            to="/account-deletion"
            className="inline-flex min-h-11 items-center font-semibold text-accentStrong underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            계정 삭제 안내
          </Link>
        </div>
      </section>
    </InfoPageShell>
  );
};

export default ContactPage;
