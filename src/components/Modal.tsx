import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TbX } from 'react-icons/tb';
import { entranceAnimation } from '../utils/Animation';

interface ButtonType {
  label: string;
  onClick?: () => void;
  type?: 'primary' | 'secondary';
}

interface ModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  subMessage?: string;
  subMessageClass?: string;
  input?: boolean;
  inputValue?: string;
  inputPlaceholder?: string;
  onInputChange?: (value: string) => void;
  onClose: () => void;
  buttons?: ButtonType[];
  children?: React.ReactNode;
  inputType?: string;
  widthClass?: string;
  animateOnOpen?: boolean;
  shadowStyle?: React.CSSProperties;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  message,
  subMessage = '',
  subMessageClass = '',
  input = false,
  inputType = 'text',
  inputValue = '',
  inputPlaceholder = '',
  onInputChange,
  onClose,
  buttons = [],
  children,
  widthClass,
  animateOnOpen,
  shadowStyle,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (isOpen && animateOnOpen && modalRef.current) {
      entranceAnimation.bounceToFront(modalRef.current);
    }
  }, [isOpen, animateOnOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

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

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={message || subMessage ? descriptionId : undefined}
        className={`relative ${widthClass ?? 'w-full max-w-[500px]'} bg-white rounded-[20px] shadow-xl p-10 flex flex-col items-center max-sm:p-5 max-sm:w-[90%]`}
        style={shadowStyle}
      >
        {/* 닫기 버튼 */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="모달 닫기"
          className="absolute top-5 right-5 rounded-full text-grey04 hover:text-grey05 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
        >
          <TbX size={24} className="max-sm:w-5 max-sm:h-5" />
        </button>

        {/* 제목 */}
        {title && (
          <h2
            id={titleId}
            className="text-title-4 font-bold text-black text-center w-full max-sm:text-title-6 max-sm:font-bold"
          >
            {title}
          </h2>
        )}

        {/* 메시지 */}
        {message && (
          <p
            id={descriptionId}
            className="text-body-0 text-black whitespace-pre-line text-center mt-[16px] w-full max-sm:text-body-2"
          >
            {message}
          </p>
        )}

        {/* 서브 메시지 */}
        {subMessage && (
          <p
            id={!message ? descriptionId : undefined}
            className={`text-center text-black w-full mt-[8px] text-body-0 whitespace-pre-line max-sm:text-body-2 ${subMessageClass}`}
          >
            {subMessage}
          </p>
        )}

        {/* 입력창 */}
        {input && (
          <input
            type={inputType}
            className="w-full max-w-[436px] h-[50px] mt-[20px] px-[20px] bg-grey01 rounded-[10px] text-body-2 text-grey05 placeholder-grey03 max-sm:text-body-3"
            placeholder={inputPlaceholder}
            value={inputValue}
            onChange={(e) => onInputChange?.(e.target.value)}
          />
        )}

        {/* 하단 자식 요소 */}
        {children && <div className="mt-[20px] w-full flex justify-center">{children}</div>}

        {/* 버튼 영역 */}
        {buttons.length > 0 && (
          <div className="mt-[20px] w-full flex gap-4 max-sm:gap-3">
            {buttons.map((btn, idx) => {
              const typeClass =
                btn.type === 'primary'
                  ? 'bg-purple04 text-white hover:bg-purple05'
                  : 'border border-grey02 text-grey04 hover:text-grey05 hover:border-grey04';

              return (
                <button
                  key={idx}
                  className={`flex-1 h-[56px] rounded-[10px] text-title-6 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 ${typeClass} max-xl:h-[52px] max-sm:h-[46px] max-sm:text-title-7`}
                  onClick={btn.onClick}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body // ✅ 포탈 적용
  );
};

export default Modal;
