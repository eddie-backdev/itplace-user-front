const AuthSideCard = () => {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-5 overflow-hidden rounded-[30px] bg-warmCanvas px-8 text-center max-xl:rounded-[26px] max-lg:rounded-[20px] max-md:rounded-none max-md:pb-6 max-md:pt-16"
    >
      <img
        src="/images/brand/mark.svg"
        alt=""
        aria-hidden="true"
        width={64}
        height={64}
        className="h-16 w-16"
      />
      <div>
        <h2 className="text-title-4 font-bold text-ink">잇플레이스</h2>
        <p className="mt-2 whitespace-pre-line text-body-2 leading-7 text-warmMuted">
          통신사 혜택과 주변 제휴처를
          <br />
          한곳에서 확인해 보세요.
        </p>
      </div>
    </div>
  );
};

export default AuthSideCard;
