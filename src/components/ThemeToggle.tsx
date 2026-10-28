'use client';

import { useLayoutEffect, useState } from 'react';
import { TbMoon, TbSun } from 'react-icons/tb';
import {
  getDocumentTheme,
  setDesktopTheme,
  THEME_CHANGE_EVENT,
  type Theme,
} from '@/utils/desktopTheme';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useLayoutEffect(() => {
    const sync = () => setTheme(getDocumentTheme());
    sync();
    window.addEventListener(THEME_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, sync);
    };
  }, []);

  function toggleTheme() {
    if (!window.matchMedia('(min-width: 768px)').matches) return;
    const nextTheme = getDocumentTheme() === 'dark' ? 'light' : 'dark';
    setDesktopTheme(nextTheme);
  }

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={`화면을 ${theme === 'dark' ? '라이트' : '다크'} 모드로 전환`}
      title={`${theme === 'dark' ? '라이트' : '다크'} 모드`}
    >
      {theme === 'dark' ? <TbSun aria-hidden="true" /> : <TbMoon aria-hidden="true" />}
    </button>
  );
}
