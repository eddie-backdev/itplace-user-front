const RouteLoadingFallback = () => (
  <div
    role="status"
    aria-live="polite"
    className="flex min-h-[50vh] items-center justify-center px-5 text-sm font-bold text-grey05"
  >
    페이지를 불러오는 중...
  </div>
);

export default RouteLoadingFallback;
