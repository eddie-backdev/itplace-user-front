'use client';

import { useEffect } from 'react';
import NoResult from '@/components/NoResult';

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-5 py-16">
      <NoResult
        variant="error"
        message1="페이지를 불러오지 못했어요"
        message2="잠시 후 다시 시도해 주세요."
        buttonText="다시 시도"
        onButtonClick={reset}
      />
    </div>
  );
}
