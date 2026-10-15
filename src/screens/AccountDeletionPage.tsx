import InfoPageShell from '../components/InfoPageShell';
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../config/contact';

const lastUpdated = '2026년 5월 16일';

const AccountDeletionPage = () => {
  return (
    <>
      <InfoPageShell
        title="계정 및 데이터 삭제 요청"
        description="이 페이지는 IT:PLACE 앱 및 웹 서비스 계정과 관련 데이터의 삭제 요청 방법을 안내합니다. 사용자는 앱 안에서 직접 회원 탈퇴를 진행하거나, 아래 이메일을 통해 계정 삭제를 요청할 수 있습니다."
        contents={[
          { id: 'deletion-in-app', label: '앱에서 직접 삭제하는 방법' },
          { id: 'deletion-email', label: '이메일로 삭제를 요청하는 방법' },
          { id: 'deletion-data', label: '삭제되는 데이터' },
          { id: 'deletion-retention', label: '보관될 수 있는 데이터와 보관 기간' },
          { id: 'deletion-processing', label: '처리 안내' },
        ]}
        relatedLinks={[
          { label: '개인정보처리방침', to: '/privacy' },
          { label: '이용약관', to: '/terms' },
          { label: '문의', to: '/contact' },
        ]}
      >
        <div className="max-w-[820px] space-y-8 wide:max-w-none">
          <p className="text-sm font-medium text-warmMuted">시행일: {lastUpdated}</p>

          <section id="deletion-in-app" className="scroll-mt-6 border-b border-warmBorder pb-7">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink sm:text-xl">
              앱에서 직접 삭제하는 방법
            </h2>
            <ol className="mt-3 list-decimal space-y-3 pl-5 text-[15px] leading-7 text-grey06">
              <li>IT:PLACE 앱에 로그인합니다.</li>
              <li>하단의 마이 탭으로 이동합니다.</li>
              <li>내 정보 탭에서 회원 탈퇴를 선택합니다.</li>
              <li>비밀번호를 입력한 뒤 탈퇴를 완료합니다.</li>
            </ol>
          </section>

          <section id="deletion-email" className="scroll-mt-6 border-b border-warmBorder pb-7">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink sm:text-xl">
              이메일로 삭제를 요청하는 방법
            </h2>
            <p className="mt-3 max-w-[80ch] text-[15px] leading-7 text-grey06">
              앱에 로그인할 수 없거나 직접 탈퇴가 어려운 경우 아래 이메일로 계정 삭제를 요청해
              주세요. 요청 시 가입 이메일 주소를 함께 보내주시면 본인 확인 후 처리합니다.
            </p>
            <div className="mt-4 border-t border-warmBorder pt-3">
              <p className="text-sm font-bold text-grey05">계정 삭제 요청 이메일</p>
              <a
                className="mt-1 inline-flex min-h-11 items-center rounded-md font-medium text-brandStrong underline underline-offset-4 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                href={CONTACT_MAILTO}
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </section>

          <section id="deletion-data" className="scroll-mt-6 border-b border-warmBorder pb-7">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink sm:text-xl">
              삭제되는 데이터
            </h2>
            <ul className="mt-3 max-w-[80ch] list-disc space-y-3 pl-5 text-[15px] leading-7 text-grey06">
              <li>계정 기본 정보: 이름, 이메일, 비밀번호, 휴대폰 번호, 생년월일, 성별</li>
              <li>멤버십 정보: 통신사, 멤버십 등급, 멤버십 인증 상태</li>
              <li>앱 사용 데이터: 관심 혜택, 개인화 추천 관련 정보</li>
              <li>인증 정보: 로그인 세션, refresh token 등 계정 인증에 필요한 정보</li>
            </ul>
          </section>

          <section id="deletion-retention" className="scroll-mt-6 border-b border-warmBorder pb-7">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink sm:text-xl">
              보관될 수 있는 데이터와 보관 기간
            </h2>
            <ul className="mt-3 max-w-[80ch] list-disc space-y-3 pl-5 text-[15px] leading-7 text-grey06">
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

          <section id="deletion-processing" className="scroll-mt-6 border-b border-warmBorder pb-7">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink sm:text-xl">
              처리 안내
            </h2>
            <p className="mt-3 max-w-[80ch] text-[15px] leading-7 text-grey06">
              이메일로 접수된 계정 삭제 요청은 본인 확인 후 처리합니다. 본인 확인에 필요한 정보가
              부족한 경우 추가 확인을 요청할 수 있습니다.
            </p>
          </section>
        </div>
      </InfoPageShell>
    </>
  );
};

export default AccountDeletionPage;
