import Image from 'next/image';
import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import { createPageMetadata } from '@/lib/metadata';
import { APP_DOWNLOAD } from '@/lib/appDownload';
import styles from './page.module.css';

export const metadata = createPageMetadata({
  title: 'Android 앱 다운로드 | 잇플레이스',
  description: '잇플레이스 Android 앱 다운로드와 설치 방법을 확인하세요.',
  path: '/download',
});

export default function DownloadPage() {
  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <header className={styles.header}>
          <p className={styles.kicker}>ITPLACE Android 앱</p>
          <h1>잇플레이스를 앱으로 만나보세요</h1>
          <p>정식 출시는 11월 14일 예정입니다. 지금은 웹에서 다운로드 후 이용할 수 있어요.</p>
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
            <a className={styles.downloadButton} href={APP_DOWNLOAD.apkHref} download>
              Android 앱 다운로드
            </a>
            <p>Android 기기에서만 설치할 수 있어요.</p>
          </div>

          <div className={styles.desktopQr}>
            <Image src={APP_DOWNLOAD.qrImage} alt="잇플레이스 앱 다운로드 페이지 QR 코드" width={144} height={144} />
            <p>휴대폰 카메라로 스캔해<br />안드로이드 앱을 다운로드하세요.</p>
          </div>

          <dl className={styles.release}>
            <div><dt>버전</dt><dd>{APP_DOWNLOAD.version} ({APP_DOWNLOAD.build})</dd></div>
            <div><dt>배포일</dt><dd>{APP_DOWNLOAD.releaseDate}</dd></div>
            <div><dt>파일 크기</dt><dd>{APP_DOWNLOAD.fileSize}</dd></div>
          </dl>
          <p className={styles.testNote}>Google Play를 통해 설치했다면, 안내받은 Google Play 링크를 이용해 주세요.</p>
        </section>

        <section className={styles.install} aria-labelledby="install-title">
          <h2 id="install-title">설치 방법</h2>
          <ol>
            <li>위의 버튼을 눌러 APK 파일을 다운로드하세요.</li>
            <li>다운로드가 끝나면 알림이나 파일 앱에서 APK를 열어 설치를 진행하세요.</li>
            <li>브라우저에서 설치를 요청하면 해당 브라우저의 앱 설치 권한을 허용한 뒤 다시 여세요.</li>
          </ol>
          <p>iPhone에서는 Android 앱을 설치할 수 없어요. <Link href="/">웹에서 계속 이용하기</Link></p>
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}
