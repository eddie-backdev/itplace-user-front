import React, { useEffect, useId, useRef } from 'react';
import { TbX } from 'react-icons/tb';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black bg-opacity-50 flex items-center justify-center p-4 max-md:p-2"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full max-h-[560px] w-full max-w-[680px] flex-col overflow-hidden rounded-[18px] bg-white max-md:max-h-[68vh] max-md:max-w-[328px] max-md:rounded-[16px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="flex shrink-0 items-center justify-between rounded-t-[18px] bg-grey01 py-3 pl-5 pr-3 max-md:rounded-t-[16px] max-md:pl-4 max-md:pr-2">
          <h3 id={titleId} className="text-title-7 font-bold text-grey07 max-md:text-title-8">
            {title}
          </h3>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="모달 닫기"
            className="flex h-10 w-10 items-center justify-center rounded-full text-grey05 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
          >
            <TbX className="h-7 w-7 max-md:h-6 max-md:w-6" />
          </button>
        </div>

        {/* 모달 내용 */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-white">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
