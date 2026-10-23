const parsePayload = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error('응답 형식이 올바르지 않아요. 잠시 후 다시 시도해주세요.');
  }
};

const isQuestionRecommendationData = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) &&
  typeof value.reason === 'string' && Array.isArray(value.partners) &&
  value.partners.every((partner) => partner && typeof partner.partnerName === 'string') &&
  ['ANSWER', 'CLARIFICATION', 'NO_RESULTS', 'UNAVAILABLE', 'OUT_OF_SCOPE'].includes(value.status) &&
  Array.isArray(value.suggestedQuestions) && value.suggestedQuestions.every((question) => typeof question === 'string') &&
  typeof value.traceId === 'string';

const dispatchEvent = (event, data, handlers, terminal) => {
  if (!data) return terminal;
  const payload = parsePayload(data);
  if (event === 'status') {
    if (!['planning', 'searching', 'answering'].includes(payload?.stage)) throw new Error('응답 형식이 올바르지 않아요.');
    handlers.onStatus?.(payload.stage);
  } else if (event === 'cards') {
    if (!isQuestionRecommendationData(payload)) throw new Error('혜택 목록 응답이 올바르지 않아요.');
    handlers.onCards?.(payload);
  } else if (event === 'done') {
    if (!isQuestionRecommendationData(payload)) throw new Error('최종 답변 형식이 올바르지 않아요.');
    handlers.onDone?.(payload);
    return true;
  } else if (event === 'error') {
    throw Object.assign(new Error(typeof payload?.message === 'string' ? payload.message : '답변을 가져오지 못했어요. 다시 시도해주세요.'), {
      retryable: payload?.retryable === true,
    });
  } else {
    throw new Error('알 수 없는 응답 형식이에요. 다시 시도해주세요.');
  }
  return terminal;
};

export async function consumeQuestionRecommendationStream(stream, handlers = {}) {
  if (!stream?.getReader) throw new Error('스트림 응답을 읽을 수 없어요.');
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let event = 'message';
  let data = [];
  let done = false;
  const processLine = (line) => {
    if (done) return;
    if (!line) {
      done = dispatchEvent(event, data.join('\n'), handlers, done);
      event = 'message';
      data = [];
    } else if (line.startsWith(':')) {
      return;
    } else {
      const colon = line.indexOf(':');
      const field = colon < 0 ? line : line.slice(0, colon);
      const value = colon < 0 ? '' : line.slice(colon + 1).replace(/^ /, '');
      if (field === 'event') event = value;
      else if (field === 'data') data.push(value);
    }
  };
  try {
    while (!done) {
      const result = await reader.read();
      buffer += result.done ? decoder.decode() : decoder.decode(result.value, { stream: true });
      let newline;
      while ((newline = buffer.search(/[\r\n]/)) !== -1) {
        if (buffer[newline] === '\r' && newline === buffer.length - 1 && !result.done) break;
        const width = buffer[newline] === '\r' && buffer[newline + 1] === '\n' ? 2 : 1;
        processLine(buffer.slice(0, newline));
        buffer = buffer.slice(newline + width);
      }
      if (result.done) break;
    }
    if (!done) throw new Error('답변이 완료되기 전에 연결이 종료됐어요. 다시 시도해주세요.');
    await reader.cancel().catch(() => {});
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}
