import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  prettierConfig,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      // GSAP가 직접 제어하는 랜딩 이미지, Kakao marker 이미지와 SafeImage의
      // onError fallback은 네이티브 img 요소가 필요하다.
      '@next/next/no-img-element': 'off',
      // 이전 앱의 ref 기반 지도 이벤트 브리지와 effect 기반 비동기 로딩은
      // React Compiler 최적화 대상이 아니다. 동작을 보존한 채 Next 규칙은 유지한다.
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    '.open-next/**',
    '.wrangler/**',
    'out/**',
    'output/**',
    '.playwright-cli/**',
    'next-env.d.ts',
  ]),
]);
