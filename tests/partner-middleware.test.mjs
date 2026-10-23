import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { test } from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);

const loadMiddleware = () => {
  const filename = resolve('src/middleware.ts');
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const nextResponse = {
    next: () => ({ type: 'next' }),
    rewrite: (url, options) => ({ type: 'rewrite', url, ...options }),
    redirect: (url, status) => ({ type: 'redirect', url, status }),
  };
  const localRequire = (name) => {
    if (name === 'next/server') return { NextResponse: nextResponse };
    if (name === '@/config/membershipPages') return { CARRIER_PAGE_CONFIGS: [] };
    if (name === '@/utils/partnerSeo') return {
      createPartnerSlug: (name) => name.normalize('NFKC').trim().toLocaleLowerCase('ko-KR')
        .replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/^-+|-+$/g, '') || 'partner',
    };
    return require(name);
  };
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(localRequire, loaded, loaded.exports);
  return loaded.exports.middleware;
};

const createRequest = (path) => {
  const url = new URL(path, 'http://localhost:5173');
  return { nextUrl: Object.assign(url, { clone: () => new URL(url) }) };
};

test('VIP-only partner resolves without a category filter and canonical redirect keeps query', async () => {
  const middleware = loadMiddleware();
  const originalFetch = globalThis.fetch;
  const requestedUrls = [];
  globalThis.fetch = async (input) => {
    requestedUrls.push(new URL(String(input)));
    return { status: 200, ok: true, json: async () => ({ data: { partnerName: '볼트업' } }) };
  };

  try {
    const valid = await middleware(createRequest('/benefits/partners/483/볼트업'));
    assert.equal(valid.type, 'next');
    assert.equal(requestedUrls[0].searchParams.has('mainCategory'), false);

    const redirected = await middleware(
      createRequest('/benefits/partners/483/wrong?carrier=LGU&grade=VIP&membership=mine')
    );
    assert.equal(redirected.type, 'redirect');
    assert.equal(redirected.status, 308);
    assert.equal(decodeURIComponent(redirected.url.pathname), '/benefits/partners/483/볼트업');
    assert.equal(redirected.url.search, '?carrier=LGU&grade=VIP&membership=mine');
    assert.equal(requestedUrls[1].searchParams.has('mainCategory'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
