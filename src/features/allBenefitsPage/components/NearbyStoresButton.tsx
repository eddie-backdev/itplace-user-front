'use client';

import { useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { TbMapPin } from 'react-icons/tb';

interface NearbyStoresButtonProps {
  partner: { partnerId: number; partnerName: string; image?: string | null };
  className?: string;
  children?: ReactNode;
}

const NearbyStoresDialog = dynamic(
  () => import('./NearbyStoresDialog'),
  {
    ssr: false,
    loading: () => (
      <p role="status" aria-live="polite">
        주변 매장을 불러오는 중입니다.
      </p>
    ),
  }
);

export default function NearbyStoresButton({
  partner,
  className,
  children,
}: NearbyStoresButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        aria-haspopup="dialog"
        onClick={(event) => {
          event.currentTarget.focus();
          setIsOpen(true);
        }}
        style={{ border: 0, fontFamily: 'inherit', cursor: 'pointer' }}
      >
        {children ?? (
          <>
            <TbMapPin aria-hidden="true" /> 주변 매장 찾기
          </>
        )}
      </button>
      {isOpen ? <NearbyStoresDialog partner={partner} onClose={() => setIsOpen(false)} /> : null}
    </>
  );
}
