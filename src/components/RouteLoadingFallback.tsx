const RouteLoadingFallback = ({ children = '페이지를 불러오는 중…' }: { children?: string }) => (
  <div
    role="status"
    aria-live="polite"
    className="flex min-h-[50vh] items-center justify-center px-5 text-sm font-bold text-grey05"
  >
    {children}
  </div>
);

export default RouteLoadingFallback;
