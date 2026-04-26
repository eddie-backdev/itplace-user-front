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
        className="bg-white rounded-[20px] relative overflow-hidden w-full h-full max-w-[800px] max-h-[664px] max-md:max-w-[340px] max-md:max-h-[80vh] max-md:rounded-[16px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="bg-grey01 rounded-t-[20px] max-md:rounded-t-[16px] flex items-center justify-between pl-8 max-md:pl-4 pt-6 max-md:pt-4 pb-4 max-md:pb-3 pr-4 max-md:pr-3">
          <h3 id={titleId} className="text-title-5 max-md:text-title-7">
            {title}
          </h3>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="모달 닫기"
            className="rounded-full text-grey05 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
          >
            <TbX size={36} className="max-md:w-8 max-md:h-8" />
          </button>
        </div>

        {/* 모달 내용 */}
        <div className="bg-white overflow-y-auto" style={{ height: 'calc(100% - 88px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
