import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TbX } from 'react-icons/tb';
import { disableScroll, enableScroll } from '../utils/scrollLock';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const FOCUSABLE_ELEMENT_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const DetailModal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    disableScroll();

    const timer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const modal = modalRef.current;
      if (!modal) {
        return;
      }

      const focusableElements = Array.from(
        modal.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENT_SELECTOR)
      ).filter((element) => !element.hasAttribute('disabled'));

      if (focusableElements.length === 0) {
        event.preventDefault();
        modal.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === firstElement || !modal.contains(activeElement))) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        (activeElement === lastElement || !modal.contains(activeElement))
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      enableScroll();
      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      data-itplace-transient-layer="open"
      className="fixed inset-0 z-[var(--itplace-layer-transient-backdrop)] bg-black bg-opacity-50 flex items-center justify-center p-4 max-md:p-2"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
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
    </div>,
    document.body
  );
};

export default DetailModal;
