import { ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface RightAsideProps {
  children: ReactNode;
  bottomImage?: string; // 기본 이미지 (webp)
  bottomImageAlt?: string;
  bottomImageFallback?: string; // 로드 실패 시 대체 이미지 (png)
}

export default function RightAside({
  children,
  bottomImage,
  bottomImageAlt,
  bottomImageFallback,
}: RightAsideProps) {
  const [imgSrc, setImgSrc] = useState(bottomImage); // 현재 이미지 소스

  const { pathname } = useLocation();

  // ✅ 모바일 레이아웃을 위한 조건분기
  const isSimpleLayout =
    pathname.startsWith('/mypage/favorites') || pathname.startsWith('/mypage/history');

  return (
    <aside
      className={
        'w-full max-w-[360px] min-w-[310px] min-h-[620px] max-xlg:min-h-0 bg-white/95 rounded-[24px] border border-white/80 shadow-[0_14px_36px_rgba(37,9,97,0.09)] pt-[32px] pb-[26px] px-[28px] flex flex-col max-xl:max-w-[320px] max-xl:min-w-[280px] max-xl:pt-[30px] max-xlg:max-w-none max-xlg:w-full max-xlg:min-w-[240px] max-xlg:pt-[26px] max-xlg:pb-[24px] max-xlg:px-[24px] max-md:w-full max-md:rounded-[22px] max-md:p-5 ' +
        (isSimpleLayout ? ' max-md:hidden' : '')
      }
    >
      {/* 위쪽 내용 */}
      <div className="flex-1">{children}</div>

      {/* 아래쪽 토끼 이미지 영역 */}
      {imgSrc && (
        <div className="mt-auto flex justify-center mb-[-12px] max-xlg:hidden">
          <img
            src={imgSrc}
            alt={bottomImageAlt ?? '하단 이미지'}
            className="w-[180px] h-auto object-contain max-xl:w-[150px]"
            onError={() => {
              // webp 로드 실패 시 fallback으로 교체
              if (bottomImageFallback) {
                setImgSrc(bottomImageFallback);
              }
            }}
          />
        </div>
      )}
    </aside>
  );
}
