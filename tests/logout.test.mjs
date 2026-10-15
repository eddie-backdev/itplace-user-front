import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);

function loadLogoutHook(mocks) {
  const source = require('node:fs').readFileSync(
    new URL('../src/hooks/useLogout.ts', import.meta.url),
    'utf8'
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const hookModule = { exports: {} };
  const mockedRequire = (specifier) => {
    const dependency = {
      react: {
        useCallback: (callback) => callback,
        useRef: (current) => ({ current }),
        useState: (initial) => [initial, (next) => mocks.pending.push(next)],
      },
      'react-redux': { useDispatch: () => mocks.dispatch },
      '@/apis/axiosInstance': { default: { post: mocks.post } },
      '@/apis/csrf': { clearCsrfToken: mocks.clearCsrfToken },
      '@/store': { persistor: { purge: mocks.purge } },
      '@/store/authSlice': { logout: mocks.logoutAction },
      '@/utils/toast': { showToast: mocks.showToast },
      '@/lib/navigation': { useNavigate: () => mocks.navigate },
    }[specifier];
    if (!dependency) throw new Error(`Unexpected import: ${specifier}`);
    return dependency;
  };

  vm.runInThisContext(`(function (require, hookModule, exports) { ${compiled}\n})`)(
    mockedRequire,
    hookModule,
    hookModule.exports
  );
  return hookModule.exports.useLogout;
}

const createMocks = (post) => ({
  post,
  dispatch: (action) => actions.push(action),
  clearCsrfToken: () => events.push('csrf'),
  purge: () => {
    events.push('purge');
    return Promise.resolve();
  },
  logoutAction: () => 'logout-action',
  showToast: (...args) => events.push(['toast', ...args]),
  navigate: (...args) => events.push(['navigate', ...args]),
  pending: [],
});

let events;
let actions;

test('successful logout clears auth and browser state, then replaces home route', async () => {
  events = [];
  actions = [];
  let removedKey;
  const originalSessionStorage = globalThis.sessionStorage;
  globalThis.sessionStorage = { removeItem: (key) => (removedKey = key) };
  const mocks = createMocks(async (path) => events.push(['post', path]));

  try {
    const { handleLogout } = loadLogoutHook(mocks)();
    await handleLogout();
  } finally {
    if (originalSessionStorage === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = originalSessionStorage;
  }

  assert.deepEqual(actions, ['logout-action']);
  assert.equal(removedKey, 'chatMessages');
  assert.deepEqual(events, [
    ['post', '/api/v1/auth/logout'],
    'csrf',
    'purge',
    ['toast', '로그아웃 되었습니다.', 'success'],
    ['navigate', '/', { replace: true }],
  ]);
});

test('failed logout keeps auth, ignores duplicate calls, and allows a retry', async () => {
  events = [];
  actions = [];
  let releaseFirstRequest;
  let attempts = 0;
  const mocks = createMocks(() => {
    attempts += 1;
    if (attempts === 1) {
      return new Promise((resolve, reject) => {
        releaseFirstRequest = () => reject(new Error('server unavailable'));
      });
    }
    return Promise.resolve(true);
  });
  const { handleLogout } = loadLogoutHook(mocks)();

  const pendingRequest = handleLogout();
  await handleLogout();
  assert.equal(attempts, 1);
  releaseFirstRequest();
  await pendingRequest;
  assert.deepEqual(actions, []);
  assert.equal(events.includes('csrf'), false);
  await handleLogout();

  assert.equal(attempts, 2);
  assert.deepEqual(actions, ['logout-action']);
  assert.ok(events.some((event) => event === 'csrf'));
  assert.ok(
    events.some(
      (event) =>
        Array.isArray(event) &&
        event[0] === 'toast' &&
        event[1] === '로그아웃에 실패했습니다. 다시 시도해주세요.' &&
        event[2] === 'error'
    )
  );
});
