const AuthSideCard = () => {
  return (
    <div
      aria-hidden="true"
      className="flex h-full w-full items-center justify-center overflow-hidden rounded-[30px] bg-warmNav px-8 max-xl:rounded-[26px] max-lg:rounded-[20px] max-md:rounded-none max-md:pb-6 max-md:pt-16"
    >
      <img
        src="/images/itplace-mascot-login-required.webp"
        alt=""
        width={512}
        height={512}
        draggable={false}
        className="h-auto w-full max-w-[280px] object-contain max-md:h-full max-md:w-auto"
      />
    </div>
  );
};

export default AuthSideCard;
