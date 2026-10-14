import React from 'react';

type Props = {
  nickname: string | null;
  gender: string | null;
  birthday: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  email: string | null;
  hasLocalPassword?: boolean;
  socialAccount?: boolean;
  onChangePasswordClick?: () => void;
  onPhoneVerificationClick?: () => void;
  onDeleteClick?: () => void;
};

const displayValue = (value: string | null | undefined) => value?.trim() || '미등록';

const displayGender = (gender: string | null) => {
  if (gender === 'MALE') return '남성';
  if (gender === 'FEMALE') return '여성';
  return '미등록';
};

const UserInfoForm: React.FC<Props> = ({
  nickname,
  gender,
  birthday,
  phoneNumber,
  phoneVerified,
  email,
  hasLocalPassword,
  socialAccount,
  onChangePasswordClick,
  onPhoneVerificationClick,
  onDeleteClick,
}) => {
  const rows = [
    { label: '닉네임', value: displayValue(nickname) },
    { label: '성별', value: displayGender(gender) },
    {
      label: '생년월일',
      value: birthday?.trim() ? birthday.replace(/-/g, '.') : '미등록',
    },
    { label: '이메일', value: displayValue(email), breakAll: true },
  ];

  return (
    <section
      aria-labelledby="account-info-heading"
      className="rounded-2xl border border-warmBorder bg-white p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="account-info-heading" className="text-lg font-semibold text-ink">
          기본 회원 정보
        </h2>
        <p className="text-sm text-grey05">가입 정보는 확인용으로 표시돼요.</p>
      </div>

      <dl className="mt-3 divide-y divide-warmBorder">
        {rows.map(({ label, value, breakAll }) => (
          <div
            key={label}
            className="grid grid-cols-[minmax(6rem,0.35fr)_minmax(0,1fr)] gap-3 py-3 sm:grid-cols-[9rem_minmax(0,1fr)]"
          >
            <dt className="text-sm font-medium text-grey05">{label}</dt>
            <dd className={`min-w-0 text-sm leading-6 text-ink ${breakAll ? 'break-all' : 'break-words'}`}>
              {value}
            </dd>
          </div>
        ))}
        <div className="grid grid-cols-[minmax(6rem,0.35fr)_minmax(0,1fr)] gap-3 py-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
          <dt className="text-sm font-medium text-grey05">휴대폰 번호</dt>
          <dd className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-sm leading-6 text-ink">
            <span>{displayValue(phoneNumber)}</span>
            {phoneVerified ? (
              <span className="rounded-full bg-softMint px-2.5 py-1 text-xs font-semibold text-brandStrong">
                  인증 완료
              </span>
            ) : (
              <>
                <span className="rounded-full bg-warmCanvas px-2.5 py-1 text-xs font-semibold text-grey05">
                  미인증
                </span>
                <button
                  type="button"
                  onClick={onPhoneVerificationClick}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-warmBorder px-3 text-sm font-semibold text-ink hover:bg-warmCanvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  휴대폰 번호 인증
                </button>
              </>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-warmBorder pt-4">
        <h3 className="text-sm font-semibold text-ink">계정 보안</h3>
        {hasLocalPassword === false ? (
          <p className="mt-2 text-sm leading-6 text-grey05">
            {socialAccount
              ? '소셜 로그인 계정입니다. 이 계정에는 변경할 비밀번호가 등록되어 있지 않아요.'
              : '이 계정에는 변경할 비밀번호가 등록되어 있지 않아요.'}
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-grey05">비밀번호</p>
              <span aria-label="비밀번호가 설정되어 있음" className="tracking-widest text-grey04">
                ●●●●●●●●
              </span>
            </div>
            <button
              type="button"
              onClick={onChangePasswordClick}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-warmBorder px-4 text-sm font-semibold text-grey06 transition-colors hover:bg-warmCanvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              비밀번호 변경
            </button>
          </div>
        )}
        <div className="mt-4 flex justify-end border-t border-warmBorder pt-4">
          <button
            type="button"
            onClick={onDeleteClick}
            className="inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold text-grey05 transition-colors hover:bg-warmCanvas hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          >
            회원 탈퇴
          </button>
        </div>
      </div>
    </section>
  );
};

export default UserInfoForm;
