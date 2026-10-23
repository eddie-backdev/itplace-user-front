import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildChatHistory,
  createRequestGeneration,
  createRetryContext,
  buildBrandCardSummary,
  getPreviousCandidateKeys,
  groupPartnersByBrand,
  normalizeStoredChatMessages,
  safeHttpUrl,
} from '../src/features/questionRecommendationChat/utils/chatModel.mjs';
import { clearQuestionRecommendationChatStorage } from '../src/features/questionRecommendationChat/utils/chatSessionStorage.mjs';
import { consumeQuestionRecommendationStream } from '../src/features/questionRecommendationChat/utils/questionRecommendationStream.mjs';

test('history contains only preceding conversation, omitting current, greeting, and client errors', () => {
  const messages = [
    { sender: 'bot', text: 'hello' },
    { sender: 'user', text: '커피 혜택' },
    { sender: 'bot', text: '가까운 카페가 있어요.' },
    { sender: 'user', text: '현재 질문', includeInHistory: false },
    { sender: 'bot', text: 'network failure', includeInHistory: false },
  ];
  assert.deepEqual(buildChatHistory(messages, 'hello'), [
    { role: 'user', content: '커피 혜택' },
    { role: 'assistant', content: '가까운 카페가 있어요.' },
  ]);
});

test('candidate keys are deduplicated and retries can retain the exact request context', () => {
  const messages = [{ sender: 'bot', text: 'answer', partners: [
    { candidateKey: 'p:1' }, { candidateKey: 'p:1' }, { candidateKey: 'p:2' },
  ] }];
  const keys = getPreviousCandidateKeys(messages);
  assert.deepEqual(keys, ['p:1', 'p:2']);
  const retry = createRetryContext('온라인 혜택', [{ role: 'user', content: '영화 할인' }], keys);
  assert.deepEqual(retry.previousCandidateKeys, ['p:1', 'p:2']);
});

test('brand groups preserve offer rows, first appearance, fallback names, and flat comparison keys', () => {
  const partners = [
    { partnerId: 10, partnerName: 'Cafe', candidateKey: 'skt-vip', carrier: 'SKT', grade: 'VIP' },
    { partnerId: 11, partnerName: 'Store', candidateKey: 'kt-vvip', carrier: 'KT', grade: 'VVIP' },
    { partnerId: 10, partnerName: 'Cafe', candidateKey: 'kt-basic', carrier: 'KT', grade: 'BASIC' },
    { partnerId: 10, partnerName: 'Cafe', candidateKey: 'lgu-silver', carrier: 'LGU', grade: 'SILVER' },
    { partnerName: ' Coffee House ', candidateKey: 'fallback-1', carrier: 'SKT', grade: 'G1' },
    { partnerName: 'coffee house', candidateKey: 'fallback-2', carrier: 'KT', grade: 'G2' },
  ];
  const groups = groupPartnersByBrand(partners);
  assert.deepEqual(groups.map(({ partnerName }) => partnerName), ['Cafe', 'Store', ' Coffee House ']);
  assert.deepEqual(groups.map(({ partners: rows }) => rows.map(({ candidateKey }) => candidateKey)), [
    ['skt-vip', 'kt-basic', 'lgu-silver'], ['kt-vvip'], ['fallback-1', 'fallback-2'],
  ]);
  assert.deepEqual(getPreviousCandidateKeys([{ sender: 'bot', text: 'compare', partners }]), [
    'skt-vip', 'kt-vvip', 'kt-basic', 'lgu-silver', 'fallback-1', 'fallback-2',
  ]);
});

test('one brand summary condenses six offers while raw candidate keys retain order', () => {
  const partners = ['VIP', 'GOLD', 'SILVER', 'BASIC', 'VVIP', 'PLATINUM'].map((grade, index) => ({
    partnerId: 7, partnerName: 'CGV', candidateKey: `raw-${index + 1}`, carrier: 'SKT', grade,
    benefitName: 'CGV 멤버십 혜택', usageType: 'OFFLINE', offerResolution: 'SINGLE', storeCount: 2, category: 'MOVIE',
  }));
  const groups = groupPartnersByBrand(partners);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].partners.length, 6);
  assert.deepEqual(buildBrandCardSummary(groups[0].partners), {
    benefitName: 'CGV 멤버십 혜택', carriers: ['SKT'], carrier: 'SKT', usageType: 'OFFLINE',
    needsConfirmation: false, storeCount: 2, category: 'MOVIE',
  });
  assert.deepEqual(getPreviousCandidateKeys([{ sender: 'bot', text: 'CGV 혜택', partners }]), partners.map(({ candidateKey }) => candidateKey));
});

test('summary only includes carrier, grade, and usage shared by every candidate', () => {
  const candidates = [
    { partnerName: 'CGV', carrier: 'SKT', grade: 'VIP', usageType: 'OFFLINE' },
    { partnerName: 'CGV', carrier: 'SKT', grade: 'GOLD', usageType: 'OFFLINE' },
  ];
  const sameCarrier = buildBrandCardSummary(candidates);
  assert.equal(sameCarrier.carrier, 'SKT');
  assert.equal(sameCarrier.grade, undefined);
  assert.equal(sameCarrier.usageType, 'OFFLINE');

  const crossCarrier = buildBrandCardSummary([
    candidates[0], { ...candidates[0], carrier: 'KT' },
  ]);
  assert.deepEqual(crossCarrier.carriers, ['SKT', 'KT']);
  assert.equal(crossCarrier.carrier, undefined);
  assert.equal(crossCarrier.grade, undefined);

  const shared = buildBrandCardSummary([candidates[0], { ...candidates[0] }]);
  assert.equal(shared.grade, 'VIP');
  assert.equal(shared.usageType, 'OFFLINE');
  const mixedUsage = buildBrandCardSummary([candidates[0], { ...candidates[0], usageType: 'ONLINE' }]);
  assert.equal(mixedUsage.usageType, undefined);
});

test('summary falls back for mixed benefit names and flags unresolved offers', () => {
  const summary = buildBrandCardSummary([
    { partnerName: 'CGV', benefitName: '할인', offerResolution: 'SINGLE' },
    { partnerName: 'CGV', benefitName: '적립', offerResolution: 'PARTIAL' },
  ]);
  assert.equal(summary.benefitName, 'CGV 멤버십 혜택');
  assert.equal(summary.needsConfirmation, true);
});

test('HTTP URL validation rejects junk schemes and malformed values', () => {
  assert.equal(safeHttpUrl('javascript:alert(1)'), undefined);
  assert.equal(safeHttpUrl('not a url'), undefined);
  assert.equal(safeHttpUrl('https://example.com/source'), 'https://example.com/source');
});

test('stored chat normalization drops malformed card and retry data and bounds optional fields', () => {
  const messages = normalizeStoredChatMessages([{
    sender: 'bot',
    text: 'answer',
    partners: [{ partnerName: 'Cafe', policyId: 'invalid', sourceUrl: 'javascript:alert(1)' }, { policyId: 2 }],
    suggestedQuestions: ['커피 혜택', 42],
    retry: { question: '질문', messages: [{ role: 'system', content: 'bad' }, { role: 'user', content: 'ok' }], previousCandidateKeys: ['p1', 2] },
  }, { sender: 'bot', text: { malicious: true } }]);
  assert.equal(messages.length, 1);
  assert.deepEqual(messages[0].partners, [{ partnerName: 'Cafe', sourceUrl: 'javascript:alert(1)' }]);
  assert.deepEqual(messages[0].suggestedQuestions, ['커피 혜택']);
  assert.deepEqual(messages[0].retry.messages, [{ role: 'user', content: 'ok' }]);
  assert.deepEqual(messages[0].retry.previousCandidateKeys, ['p1']);
});

test('clear and logout generation invalidates any late response', () => {
  const generation = createRequestGeneration();
  const pending = generation.begin();
  generation.cancel();
  assert.equal(generation.isCurrent(pending), false);
});

test('interrupted user turns and transient preview cards stay out of request history and candidate keys', () => {
  const messages = [
    { sender: 'user', text: '이번 질문', includeInHistory: false },
    { sender: 'bot', text: '요청이 중단됐어요.', includeInHistory: false, retry: { question: '이번 질문' } },
    { sender: 'bot', text: '완료된 답변', partners: [{ candidateKey: 'verified:1' }] },
  ];
  assert.deepEqual(buildChatHistory(messages, 'hello'), [{ role: 'assistant', content: '완료된 답변' }]);
  assert.deepEqual(getPreviousCandidateKeys(messages), ['verified:1']);
});

test('logout or account switch clears every account-scoped key, tolerating blocked storage', () => {
  const data = new Map([
    ['questionRecommendationChatMessages:account-a', '[]'],
    ['questionRecommendationChatMessages:account-b', '[]'],
    ['unrelated', 'keep'],
  ]);
  const storage = Object.fromEntries([...data.keys()].map((key) => [key, data.get(key)]));
  storage.removeItem = (key) => { data.delete(key); delete storage[key]; };
  clearQuestionRecommendationChatStorage(storage);
  assert.deepEqual([...data.keys()], ['unrelated']);
  assert.doesNotThrow(() => clearQuestionRecommendationChatStorage({ get length() { throw new Error('blocked'); } }));

  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  try {
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      get() { throw new Error('storage access denied'); },
    });
    assert.doesNotThrow(() => clearQuestionRecommendationChatStorage());
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'sessionStorage', descriptor);
    else delete globalThis.sessionStorage;
  }
});

test('stream parser handles split UTF-8, CRLF boundaries, comments, and multiline data', async () => {
  const bytes = new TextEncoder().encode(
    ': heartbeat\r\nevent: status\r\ndata: {"stage":"searching"}\r\n\r\nevent: done\r\ndata: {\ndata: "reason":"커피 혜택",\ndata: "partners":[],\ndata: "status":"ANSWER",\ndata: "suggestedQuestions":[],\ndata: "traceId":"trace"\ndata: }\r\n\r\n'
  );
  const splitAt = bytes.indexOf(new TextEncoder().encode('커피')[0]) + 1;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(bytes.slice(0, splitAt));
      controller.enqueue(bytes.slice(splitAt, splitAt + 50));
      controller.enqueue(bytes.slice(splitAt + 50));
      controller.close();
    },
  });
  const stages = [];
  let result;
  await consumeQuestionRecommendationStream(stream, { onStatus: (stage) => stages.push(stage), onDone: (data) => { result = data; } });
  assert.deepEqual(stages, ['searching']);
  assert.equal(result.reason, '커피 혜택');
});

test('stream parser rejects missing terminal done and cancels malformed streams', async () => {
  const missingDone = new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode('event: status\ndata: {"stage":"planning"}\n\n')); controller.close(); },
  });
  await assert.rejects(consumeQuestionRecommendationStream(missingDone), /연결이 종료/);

  let canceled = false;
  const malformed = new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode('event: done\ndata: nope\n\n')); },
    cancel() { canceled = true; },
  });
  await assert.rejects(consumeQuestionRecommendationStream(malformed), /응답 형식/);
  assert.equal(canceled, true);
});

test('stream parser requires a complete done frame and ignores trailing events after success', async () => {
  const finalData = {
    reason: '확인한 혜택', partners: [], status: 'ANSWER', suggestedQuestions: [], traceId: 'trace',
  };
  const truncated = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(`event: done\ndata: ${JSON.stringify(finalData)}\n`));
      controller.close();
    },
  });
  let truncatedDoneCount = 0;
  await assert.rejects(
    consumeQuestionRecommendationStream(truncated, { onDone: () => { truncatedDoneCount += 1; } }),
    /연결이 종료/
  );
  assert.equal(truncatedDoneCount, 0);

  let canceled = false;
  let doneCount = 0;
  const stages = [];
  const completeWithTrailing = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(
        `event: done\ndata: ${JSON.stringify(finalData)}\n\n` +
        'event: status\ndata: {"stage":"planning"}\n\n'
      ));
    },
    cancel() { canceled = true; },
  });
  await consumeQuestionRecommendationStream(completeWithTrailing, {
    onDone: () => { doneCount += 1; },
    onStatus: (stage) => stages.push(stage),
  });
  assert.equal(doneCount, 1);
  assert.deepEqual(stages, []);
  assert.equal(canceled, true);
});

test('stream parser rejects non-string suggested questions', async () => {
  const malformed = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(
        `event: cards\ndata: ${JSON.stringify({
          reason: '', partners: [], status: 'ANSWER', suggestedQuestions: [42], traceId: 'trace',
        })}\n\n`
      ));
      controller.close();
    },
  });
  await assert.rejects(consumeQuestionRecommendationStream(malformed), /혜택 목록 응답/);
});

