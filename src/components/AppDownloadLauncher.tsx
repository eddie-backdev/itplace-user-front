'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { APP_DOWNLOAD } from '@/lib/appDownload';
import styles from './AppDownloadLauncher.module.css';

export default function AppDownloadLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleFocusIn = (event: FocusEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      buttonRef.current?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={styles.launcher} ref={containerRef}>
      <button
        ref={buttonRef}
        className={styles.desktopButton}
        type="button"
        aria-label="앱 다운로드 안내 열기"
        title="앱 다운로드"
        aria-expanded={isOpen}
        aria-controls="app-download-popover"
        onClick={() => setIsOpen((open) => !open)}
      >
        <Image src={APP_DOWNLOAD.iconImage} alt="" width={48} height={48} />
      </button>
      <Link className={styles.mobileLink} href="/download" aria-label="Android 앱 다운로드 안내" title="Android 앱 다운로드 안내">
        <Image src={APP_DOWNLOAD.iconImage} alt="" width={48} height={48} />
      </Link>
      <div
        className={styles.popover}
        id="app-download-popover"
        role="region"
        aria-label="앱 다운로드 안내"
        hidden={!isOpen}
      >
        <Image className={styles.qr} src={APP_DOWNLOAD.qrImage} alt="잇플레이스 앱 다운로드 페이지 QR 코드" width={112} height={112} />
        <div className={styles.popoverCopy}>
          <strong>Android 앱 다운로드</strong>
          <span>Google Play에서 바로 설치할 수 있어요.</span>
          <span>QR 코드를 스캔해 설치 방법과 iPhone 이용 안내를 확인하세요.</span>
          <a className={styles.storeAction} href={APP_DOWNLOAD.playStoreHref}>
            Google Play에서 설치하기
          </a>
          <Link className={styles.guideAction} href="/download">다운로드 안내 보기</Link>
        </div>
      </div>
    </div>
  );
}
