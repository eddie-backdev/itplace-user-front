const AuthDivider = ({
  className = '',
  label = '소셜 로그인',
}: {
  className?: string;
  label?: string;
}) => {
  return (
    <div
      role="separator"
      aria-label={label}
      className={`flex w-full items-center justify-center gap-3 ${className}`}
    >
      <div aria-hidden="true" className="h-px flex-1 bg-warmBorder" />
      <span className="whitespace-nowrap text-body-3 text-grey04">{label}</span>
      <div aria-hidden="true" className="h-px flex-1 bg-warmBorder" />
    </div>
  );
};

export default AuthDivider;
