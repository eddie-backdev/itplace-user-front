import { Link } from '@/lib/navigation';
import { TbBook2, TbFileText, TbHelpCircle, TbMail, TbShieldLock } from 'react-icons/tb';
import InfoPageShell from '../components/InfoPageShell';

const servicePoints = [
  '통신사 멤버십 제휴처를 지도와 목록에서 한 번에 탐색합니다.',
  '온라인과 오프라인 혜택 조건, 이용 채널, 멤버십 등급별 혜택을 구분해 안내합니다.',
  '현재 위치 또는 검색 위치 주변에서 사용할 수 있는 할인 정보를 빠르게 확인할 수 있습니다.',
  '관심 혜택을 저장하고 내 통신사·등급으로 필터링해 자주 쓰는 혜택을 다시 찾습니다.',
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
      <InfoPageShell
        title="서비스 소개"
        description="잇플레이스(ITPLACE, 잇플)는 흩어져 있는 통신 3사 멤버십 혜택을 지도, 목록과 검색으로 찾고, 등급별 조건과 실제 이용 방법을 비교하는 서비스입니다."
      >
        <section className="surface-card bg-softMint p-5 sm:p-7">
          <p className="text-sm font-semibold text-brandStrong">잇플레이스에서 할 수 있는 일</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-ink sm:text-2xl">
            통신사 혜택을 찾고, 조건을 비교하고, 다시 기록하세요
          </h2>
          <ul className="mt-4 grid gap-3 leading-7 text-grey06 md:grid-cols-2">
            {servicePoints.map((point) => (
              <li key={point} className="flex gap-3 rounded-xl bg-white/80 p-4">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/benefits"
              className="inline-flex min-h-12 items-center rounded-xl bg-brand px-5 font-semibold text-white hover:bg-brandStrong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              혜택 둘러보기
            </Link>
            <Link
              to="/map"
              className="inline-flex min-h-12 items-center rounded-xl border border-warmBorder bg-white px-5 font-semibold text-ink hover:bg-warmCanvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              지도에서 찾기
            </Link>
          </div>
        </section>

        <section className="surface-card p-5 sm:p-7">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink sm:text-2xl">
            누구에게 유용한가요?
          </h2>
          <p className="mt-4 max-w-[78ch] leading-7 text-grey06">
            통신사 멤버십을 보유하고 있지만 어떤 매장에서 어떤 혜택을 받을 수 있는지 매번 확인하기
            어려운 사용자, 주변에서 바로 사용할 수 있는 할인 정보를 찾는 사용자, 온라인과 오프라인
            혜택 조건을 구분해 보고 싶은 사용자에게 유용합니다.
          </p>
        </section>
        <section className="surface-card p-5 sm:p-7">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink sm:text-2xl">
            정보 운영 기준
          </h2>
          <ul className="mt-4 max-w-[80ch] space-y-3 leading-7 text-grey06">
            {dataPrinciples.map((principle) => (
              <li key={principle} className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                <span>{principle}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="border-t border-warmBorder pt-8">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-brandStrong sm:text-2xl">
            혜택 조건과 해설은 어떻게 구분하나요?
          </h2>
          <div className="mt-4 max-w-[70ch] space-y-4 leading-7 text-grey06">
            <p>
              상세의 등급별 혜택·이용 제한은 수집된 혜택 정보를 비교하기 쉽게 정리한 내용입니다.
              별도의 이용 해설은 조건을 해석할 때 헷갈리기 쉬운 부분을 설명하며, 확인한 공식 안내의
              출처와 확인일을 함께 표시합니다. 해설 확인일이 모든 혜택 데이터의 갱신일을 뜻하지는
              않습니다.
            </p>
            <p>
              계산 예시에 쓰인 구매액과 할인율은 가정이라고 표시합니다. 예시의 결과가 특정
              브랜드에서 받을 수 있는 실제 할인액을 뜻하지는 않습니다. 현재 조건은 상세의 공식
              원문에서 확인해 주세요.
            </p>
            <p>
              잇플레이스는 통신사나 제휴처의 공식 운영 서비스가 아닙니다. 정보가 다르다면
              통신사·제휴처명과 공식 안내 주소를{' '}
              <Link
                to="/contact"
                className="font-bold text-brandStrong underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                문의로 알려주세요
              </Link>
              . 바코드·회원번호·개인정보는 보내지 않아도 됩니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink sm:text-2xl">
            더 알아보기
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {guideLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group surface-card p-4 transition-colors hover:border-brand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brandSoft text-brandStrong">
                      <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <span className="font-semibold text-ink group-hover:text-brandStrong">
                      {item.label}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-warmMuted">{item.description}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </InfoPageShell>
    </>
  );
};

export default AboutPage;
