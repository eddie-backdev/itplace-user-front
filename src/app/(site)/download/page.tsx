import Image from 'next/image';
import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import { createPageMetadata } from '@/lib/metadata';
import { APP_DOWNLOAD } from '@/lib/appDownload';
import styles from './page.module.css';

export const metadata = createPageMetadata({
  title: '앱 다운로드 | 잇플레이스',
  description: 'Google Play에서 잇플레이스 앱을 설치하는 방법을 확인하세요.',
  path: '/download',
});

export default function DownloadPage() {
  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <header className={styles.header}>
          <p className={styles.kicker}>ITPLACE 앱</p>
          <h1>잇플레이스를 앱으로 만나보세요</h1>
          <p>Android는 Google Play에서 설치할 수 있고, iPhone에서는 웹으로 이용할 수 있어요.</p>
        </header>

        <section className={styles.download} aria-labelledby="download-title">
          <div className={styles.appInfo}>
            <Image className={styles.icon} src={APP_DOWNLOAD.iconImage} alt="잇플레이스 앱 아이콘" width={72} height={72} />
            <div>
              <h2 id="download-title">잇플레이스</h2>
              <p>{APP_DOWNLOAD.minimumAndroid}</p>
            </div>
          </div>

          <div className={styles.mobileCta}>
            <a className={styles.downloadButton} href={APP_DOWNLOAD.playStoreHref}>
              Google Play에서 설치하기
            </a>
            <p>버튼을 누르면 Google Play의 잇플레이스 페이지가 열립니다.</p>
          </div>

          <div className={styles.desktopQr}>
            <Image src={APP_DOWNLOAD.qrImage} alt="잇플레이스 앱 다운로드 페이지 QR 코드" width={144} height={144} />
            <p>휴대폰 카메라로 스캔해<br />다운로드 페이지를 여세요.</p>
          </div>
        </section>

        <section className={styles.install} aria-labelledby="install-title">
          <h2 id="install-title">설치 방법</h2>
          <ol>
            <li><a href={APP_DOWNLOAD.playStoreHref}>Google Play에서 잇플레이스 페이지를 여세요.</a></li>
            <li>설치 버튼을 누르고 설치가 끝날 때까지 기다리세요.</li>
            <li>설치가 완료되면 잇플레이스 앱을 여세요.</li>
          </ol>
          <p>iPhone에서는 앱을 설치하지 않아도 <Link href="/">잇플레이스 웹</Link>을 이용할 수 있어요.</p>
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}
