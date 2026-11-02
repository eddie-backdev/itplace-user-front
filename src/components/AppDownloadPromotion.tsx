import Image from 'next/image';
import Link from 'next/link';
import { APP_DOWNLOAD } from '@/lib/appDownload';
import styles from './AppDownloadPromotion.module.css';

export default function AppDownloadPromotion() {
  return (
    <aside className={styles.promotion} aria-labelledby="app-promotion-title">
      <div className={styles.copy}>
        <p className={styles.kicker}>ITPLACE Android 앱</p>
        <h2 id="app-promotion-title">혜택 찾기를 더 편하게</h2>
        <p>잇플레이스 앱으로 주변 제휴 혜택을 찾아보세요.</p>
      </div>
      <Link className={styles.desktopQr} href="/download" aria-label="QR 코드와 앱 다운로드 안내 열기">
        <Image src={APP_DOWNLOAD.qrImage} alt="" width={120} height={120} />
        <span>휴대폰으로 스캔하거나 안내 보기</span>
      </Link>
      <div className={styles.mobileAction}>
        <Image src={APP_DOWNLOAD.iconImage} alt="" width={48} height={48} />
        <div>
          <strong>Android에서 이용할 수 있어요</strong>
          <Link href="/download">앱 다운로드 안내 보기</Link>
        </div>
      </div>
    </aside>
  );
}
