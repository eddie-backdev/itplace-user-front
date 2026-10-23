'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { TbMessageCircle, TbSend, TbRefresh, TbX, TbMovie, TbCoffee, TbDeviceLaptop, TbMapPin, TbChevronRight, TbArrowUpRight } from 'react-icons/tb';
import SafeImage from '../../../components/SafeImage';
import LoadingSpinner from '../../../components/LoadingSpinner';
import {
  streamQuestionRecommendation,
  QuestionRecommendationError,
} from '../../mainPage/api/questionRecommendationApi';
import { getCurrentLocation } from '../../mainPage/api/storeApi';
import { useResponsive } from '../../../hooks/useResponsive';
import { getPartnerBenefitPath } from '../../../utils/partnerSeo';
import { getBenefitMembershipFilter, getCarrierLabel, getMembershipGradeLabel } from '../../../utils/membership';
import { useReferenceData } from '../../../components/ReferenceDataProvider';
import { getCategoryLabel } from '../../../utils/referenceData';
import { buildBrandCardSummary, buildChatHistory, createRequestGeneration, createRetryContext, getPreviousCandidateKeys, groupPartnersByBrand, normalizeStoredChatMessages } from '../utils/chatModel.mjs';
import type {
  QuestionRecommendationMessage,
  QuestionRecommendationPartner,
  QuestionRecommendationData,
} from '../../../types/questionRecommendation';
import styles from './QuestionRecommendationChat.module.css';

const STORAGE_PREFIX = 'questionRecommendationChatMessages:';
const INITIAL_MESSAGE = '어떤 혜택이 궁금하세요? 예시를 눌러 바로 물어보거나 직접 질문해보세요.';
const MAX_QUESTION = 500;
const MAX_SAVED_MESSAGES = 30;
const EXAMPLES = ['영화 할인', '커피 혜택', '온라인 혜택', '근처에서 쓸 혜택'];
const EXAMPLE_ICONS = [TbMovie, TbCoffee, TbDeviceLaptop, TbMapPin];
const CARRIERS = ['SKT', 'KT', 'LGU'];
const STREAM_STAGE_LABELS = {
  connecting: '질문을 보내고 있어요…',
  planning: '질문을 확인하고 있어요…',
  searching: '혜택을 찾고 있어요…',
  answering: '혜택 설명을 확인하고 있어요…',
} as const;
const usageLabel = (usageType?: string) =>
  usageType === 'ONLINE' ? '온라인' : usageType === 'OFFLINE' ? '매장' : usageType === 'BOTH' ? '온라인·매장' : null;

interface Message {
  sender: 'user' | 'bot';
  text: string;
  partners?: QuestionRecommendationPartner[];
  suggestedQuestions?: string[];
  retry?: { question: string; messages: QuestionRecommendationMessage[]; previousCandidateKeys: string[] };
  includeInHistory?: boolean;
}

interface Props {
  onClose: () => void;
  accountKey?: string;
  presentation?: 'embedded' | 'drawer' | 'modal' | 'floating';
  onSearchPartner?: (partnerName: string) => void;
  onChangeTab?: (tabId: string) => void;
  onBottomSheetReset?: () => void;
}

const safeRead = (key: string): Message[] => {
  try {
    return normalizeStoredChatMessages(JSON.parse(sessionStorage.getItem(key) || '[]')) as Message[];
  } catch {
    return [];
  }
};

const safeWrite = (key: string, messages: Message[]) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(messages.slice(-MAX_SAVED_MESSAGES)));
  } catch {
    // Storage can be disabled or full; in-memory chat remains usable.
  }
};

const dedupePartners = (partners: QuestionRecommendationPartner[]) => {
  const seen = new Set<string>();
  return partners.filter((partner) => {
    const key = partner.candidateKey || [
      partner.policyId ?? partner.partnerId ?? partner.partnerName,
      partner.tierBenefitId ?? '',
      partner.benefitId ?? partner.benefitName ?? '',
      partner.carrier ?? '',
      partner.grade ?? '',
      partner.usageType ?? '',
    ].join(':');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const QuestionRecommendationChatRoom: React.FC<Props> = ({
  onClose,
  accountKey = 'legacy',
  onSearchPartner,
  onBottomSheetReset,
  presentation = 'embedded',
}) => {
  const { data: referenceData } = useReferenceData();
  const { isMobile, isTablet } = useResponsive();
  const isDrawer = presentation === 'drawer' && !isMobile && !isTablet;
  const storageKey = `${STORAGE_PREFIX}${encodeURIComponent(accountKey)}`;
  const [messages, setMessages] = React.useState<Message[]>(() => safeRead(storageKey));
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [streamStage, setStreamStage] = React.useState<keyof typeof STREAM_STAGE_LABELS | null>(null);
  const [previewPartners, setPreviewPartners] = React.useState<QuestionRecommendationPartner[]>([]);
  const [errorText, setErrorText] = React.useState('');
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const clearDialogRef = React.useRef<HTMLDivElement>(null);
  const clearCancelRef = React.useRef<HTMLButtonElement>(null);
  const clearButtonRef = React.useRef<HTMLButtonElement>(null);
  const wasClearConfirmRef = React.useRef(false);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);
  const inFlightRef = React.useRef(false);
  const controllerRef = React.useRef<AbortController | null>(null);
  const requestGenerationRef = React.useRef(createRequestGeneration());
  const composingRef = React.useRef(false);

  React.useEffect(() => {
    safeWrite(storageKey, messages);
    endRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [messages, previewPartners, streamStage, isLoading, errorText, storageKey]);

  React.useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    return () => previousFocusRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (showClearConfirm) {
      requestAnimationFrame(() => clearCancelRef.current?.focus());
    } else if (wasClearConfirmRef.current) {
      requestAnimationFrame(() => clearButtonRef.current?.focus());
    }
    wasClearConfirmRef.current = showClearConfirm;
  }, [showClearConfirm]);

  React.useEffect(() => {
    const originalScrollY = window.scrollY;
    if (isMobile) {
      const { height, overflow, position, top, left, right } = document.body.style;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${originalScrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      onBottomSheetReset?.();
      return () => {
        Object.assign(document.body.style, { height, overflow, position, top, left, right });
        requestAnimationFrame(() => window.scrollTo(0, originalScrollY));
      };
    }
    onBottomSheetReset?.();
  }, [isMobile, onBottomSheetReset]);

  React.useEffect(() => {
    if (!isMobile) return;
    const updateViewport = () =>
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      document.documentElement.style.removeProperty('--vh');
    };
  }, [isMobile]);

  React.useEffect(
    () => () => {
      requestGenerationRef.current.cancel();
      controllerRef.current?.abort();
    },
    []
  );

  const request = React.useCallback(
    async (
      question: string,
      history: QuestionRecommendationMessage[],
      previousCandidateKeys: string[],
      addUserMessage: boolean
    ) => {
      const trimmed = question.trim().slice(0, MAX_QUESTION);
      if (!trimmed || inFlightRef.current) return;
      inFlightRef.current = true;
      setIsLoading(true);
      setStreamStage('connecting');
      setPreviewPartners([]);
      setErrorText('');
      const generation = requestGenerationRef.current.begin();
      const controller = new AbortController();
      controllerRef.current = controller;
      if (addUserMessage) {
        setMessages((current) => [...current, { sender: 'user' as const, text: trimmed, includeInHistory: false }].slice(-MAX_SAVED_MESSAGES));
        setInput('');
      }

      try {
        const locationRequested = /(근처|주변|가까운|인근)/.test(trimmed);
        let location: { lat: number; lng: number } | undefined;
        if (locationRequested) {
          try {
            location = await getCurrentLocation();
          } catch {
            // The server can respond with useful guidance when coordinates are omitted.
          }
        }
        const data = await streamQuestionRecommendation(
          {
            question: trimmed,
            messages: history,
            previousCandidateKeys,
            ...(location || {}),
          },
          {
            onStatus: (stage) => {
              if (requestGenerationRef.current.isCurrent(generation)) setStreamStage(stage);
            },
            onCards: (preview: QuestionRecommendationData) => {
              if (requestGenerationRef.current.isCurrent(generation)) setPreviewPartners(dedupePartners(preview.partners || []));
            },
          },
          controller.signal
        );
        if (!requestGenerationRef.current.isCurrent(generation)) return;
        setMessages((current) => {
          const lastUserIndex = current.findLastIndex((message) => message.sender === 'user');
          return [
            ...current.map((message, index) =>
              index === lastUserIndex && message.text === trimmed && message.includeInHistory === false
                ? { ...message, includeInHistory: data.status !== 'UNAVAILABLE' }
                : message
            ),
            {
              sender: 'bot' as const,
              text: data.reason || '조건에 맞는 혜택을 확인했어요.',
              partners: dedupePartners(data.partners || []),
              suggestedQuestions: data.suggestedQuestions || [],
              retry: data.status === 'UNAVAILABLE' ? createRetryContext(trimmed, history, previousCandidateKeys) : undefined,
              includeInHistory: data.status !== 'UNAVAILABLE',
            },
          ].slice(-MAX_SAVED_MESSAGES);
        });
        if (data.status === 'UNAVAILABLE') {
          setErrorText('일시적으로 답변을 만들지 못했어요. 같은 질문으로 다시 시도할 수 있어요.');
        }
        setPreviewPartners([]);
        setStreamStage(null);
      } catch (error) {
        if (!requestGenerationRef.current.isCurrent(generation) || controller.signal.aborted) return;
        const retryable = error instanceof QuestionRecommendationError && error.retryable;
        const message =
          error instanceof Error ? error.message : '답변을 가져오지 못했어요. 다시 시도해주세요.';
        setMessages((current) =>
          [
            ...current,
            {
              sender: 'bot' as const,
              text: message,
              retry: retryable ? createRetryContext(trimmed, history, previousCandidateKeys) : undefined,
              includeInHistory: false,
            },
          ].slice(-MAX_SAVED_MESSAGES)
        );
      } finally {
        if (requestGenerationRef.current.isCurrent(generation)) {
          inFlightRef.current = false;
          controllerRef.current = null;
          setIsLoading(false);
          setStreamStage(null);
          setPreviewPartners([]);
        }
      }
    },
    []
  );

  const send = (value: string) => {
    if (inFlightRef.current) return;
    void request(value, buildChatHistory(messages, INITIAL_MESSAGE), getPreviousCandidateKeys(messages), true);
  };

  const clearChat = () => {
    requestGenerationRef.current.cancel();
    controllerRef.current?.abort();
    inFlightRef.current = false;
    setIsLoading(false);
    setStreamStage(null);
    setPreviewPartners([]);
    setErrorText('');
    setMessages([]);
    safeWrite(storageKey, []);
    setShowClearConfirm(false);
  };

  const close = () => {
    requestGenerationRef.current.cancel();
    controllerRef.current?.abort();
    setStreamStage(null);
    setPreviewPartners([]);
    onClose();
  };

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (showClearConfirm) setShowClearConfirm(false);
      else close();
    } else if (event.key === 'Tab' && dialogRef.current) {
      const scope = showClearConfirm ? clearDialogRef.current : dialogRef.current;
      const focusable = Array.from(scope?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? []);
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (scope && (!scope.contains(document.activeElement) || document.activeElement === scope)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  const openPartner = (partner: QuestionRecommendationPartner) => {
    onSearchPartner?.(partner.partnerName);
    close();
  };

  const cards = (partners: QuestionRecommendationPartner[]) =>
    groupPartnersByBrand(partners).map((group, groupIndex) => {
      const first = group.partners[0];
      const summary = buildBrandCardSummary(group.partners);
      const carrier = summary.carrier && CARRIERS.includes(summary.carrier)
        ? getCarrierLabel(summary.carrier)
        : null;
      const membership = carrier
        ? getBenefitMembershipFilter(summary.carrier, summary.grade, referenceData)
          ?? getBenefitMembershipFilter(summary.carrier, undefined, referenceData)
        : null;
      const params = membership ? new URLSearchParams({ carrier: membership.carrier }) : null;
      if (membership?.grade) params?.set('grade', membership.grade);
      const baseHref = first.partnerId ? getPartnerBenefitPath(first.partnerId, group.partnerName) : '/benefits';
      const query = params?.toString();
      const href = query ? `${baseHref}?${query}` : baseHref;
      const grade = membership?.grade && referenceData?.grades.some(({ code }) => code === membership.grade)
        ? getMembershipGradeLabel(membership.grade, referenceData)
        : null;
      const carriers = summary.carriers
        .filter((code) => CARRIERS.includes(code))
        .map((code) => getCarrierLabel(code));
      const usage = usageLabel(summary.usageType);
      const metadata = [carriers.length ? carriers.join(', ') : null, grade, usage].filter(Boolean);
      const nearby = summary.storeCount
        ? [summary.category && getCategoryLabel(summary.category, referenceData), `주변 ${summary.storeCount}곳`].filter(Boolean).join(' · ')
        : null;
      const label = carriers.length > 1 ? '혜택 비교·상세 보기' : '혜택 상세 보기';

      return (
        <a
          key={group.key}
          href={href}
          onClick={() => openPartner(first)}
          className={styles.benefitCard}
          aria-label={`${groupIndex + 1}. ${group.partnerName}, ${summary.benefitName}, ${label}`}
        >
          <span className={styles.brandOrdinal} aria-hidden="true">{groupIndex + 1}</span>
          <SafeImage src={first.imgUrl ?? ''} alt={`${group.partnerName} 로고`} fallbackLabel={group.partnerName} className={styles.benefitLogo} />
          <div className={styles.benefitCopy}>
            <h4>{group.partnerName}</h4>
            <p className={styles.benefitName}>{summary.benefitName}</p>
            {summary.needsConfirmation && <p className={styles.benefitWarning}>이용 전 적용 등급과 제한 사항을 확인해 주세요.</p>}
            {nearby && <p className={styles.benefitMeta}>{nearby}</p>}
            {metadata.length > 0 && <p className={styles.conditions}>{metadata.join(' · ')}</p>}
            <span className={styles.detailLabel}>{label}<TbChevronRight size={16} aria-hidden="true" /></span>
          </div>
        </a>
      );
    });

  const presentSuggestion = (question: string) => {
    if (question === '전체 비교') return '전체 비교';
    if (['SKT', 'KT', 'LG U+'].includes(question)) return question;
    const carrierMatch = question.match(/^(SKT|KT|LG U\+|LGU) 등급은 모르겠어$/);
    if (carrierMatch) return `${getCarrierLabel(carrierMatch[1] === 'LG U+' ? 'LGU' : carrierMatch[1])} 등급 모름`;
    const gradeMatch = question.match(/^(SKT|KT|LG U\+|LGU) (.+) 등급이야$/);
    if (gradeMatch) {
      const carrierCode = gradeMatch[1] === 'LG U+' ? 'LGU' : gradeMatch[1];
      const grade = referenceData?.grades.find(({ carrier, code, label }) => carrier === carrierCode && (code === gradeMatch[2] || label === gradeMatch[2]));
      if (grade) return `${getCarrierLabel(carrierCode)} ${grade.label}`;
    }
    return question;
  };

  const chatRoomContent = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="혜택 질문 챗봇"
      tabIndex={-1}
      onKeyDown={handleDialogKeyDown}
      data-itplace-transient-layer={isMobile || isTablet ? 'open' : undefined}
      className={`${styles.room} ${presentation === 'floating' ? styles.floatingRoom : ''} ${presentation === 'embedded' ? styles.embeddedRoom : ''} ${isDrawer ? styles.drawerRoom : ''}`}
      style={presentation === 'floating' ? undefined : isMobile || isTablet ? { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90vw', maxWidth: '400px', height: 'calc(var(--vh, 1vh) * 70)', maxHeight: '600px', minHeight: '400px', overflow: 'hidden', zIndex: 'var(--itplace-layer-transient-surface)' } : isDrawer ? { height: '100%', maxHeight: 'none', minHeight: 0, overflow: 'hidden' } : { height: '60vh', maxHeight: '60vh', minHeight: '500px', overflow: 'hidden' }}
    >
      <div className={styles.roomHeader}>
        <div className={styles.roomBrand}><span className={styles.brandMark} aria-hidden="true"><TbMessageCircle size={19} /></span><h2>혜택 도우미</h2></div>
        <div className={styles.headerActions}>
          <button ref={clearButtonRef} type="button" className={`${styles.headerAction} ${styles.headerClear}`} onClick={() => setShowClearConfirm(true)} aria-label="채팅 내용 초기화"><TbRefresh size={17} aria-hidden="true" /><span>새 대화</span></button>
          <button type="button" className={`${styles.headerAction} ${styles.headerClose}`} onClick={close} aria-label="채팅방 닫기"><TbX size={19} aria-hidden="true" /></button>
        </div>
      </div>

      <div className={styles.conversation}>
        {messages.length === 0 ? (
          <div className={styles.intro}>
            <div className={styles.welcome}><h3>어떤 혜택을 찾고 계세요?</h3><p>{INITIAL_MESSAGE}</p></div>
            <div className={styles.examples}><p>이런 질문을 해보세요</p>{EXAMPLES.map((question, index) => { const Icon = EXAMPLE_ICONS[index]; return <button key={question} type="button" disabled={isLoading} onClick={() => send(question)}><Icon size={17} aria-hidden="true" /><span>{question}</span></button>; })}</div>
          </div>
        ) : <div role="log" aria-live="polite" aria-relevant="additions text" className={styles.messages}>
          {messages.map((message, index) => message.sender === 'user' ? (
            <div key={`${index}-${message.text}`} className={styles.userMessage}><span>{message.text}</span></div>
          ) : (
            <div key={`${index}-${message.text}`} className={styles.botMessage}><div className={styles.botBubble}>{message.text}</div>{message.retry && <button type="button" disabled={isLoading} onClick={() => void request(message.retry!.question, message.retry!.messages, message.retry!.previousCandidateKeys, false)} className={styles.retryButton}><TbRefresh size={16} aria-hidden="true" /><span>다시 시도</span></button>}{message.partners?.length ? <div className={styles.cardList}>{cards(message.partners)}</div> : null}{message.suggestedQuestions?.length ? <div className={styles.suggestions}>{message.suggestedQuestions.map((question) => <button key={question} type="button" disabled={isLoading} onClick={() => send(question)} aria-label={`질문 선택: ${question}`}><span>{presentSuggestion(question)}</span><TbArrowUpRight size={15} aria-hidden="true" /></button>)}</div> : null}</div>
          ))}
        </div>}
        {isLoading && <div className={styles.botMessage}>
          <div role="status" className={styles.loadingBubble}>
            <div aria-hidden="true" className="contents"><LoadingSpinner className="mr-3 inline-block h-4 w-4 border-2 border-purple04 border-t-transparent" /></div>
            {STREAM_STAGE_LABELS[streamStage ?? 'connecting']}
          </div>
          {previewPartners.length > 0 && <div className={styles.cardList} aria-live="off">{cards(previewPartners)}</div>}
        </div>}
        {errorText && <p role="status" className={styles.error}>{errorText}</p>}
        <div ref={endRef} />
      </div>

      <form className={styles.composer} onSubmit={(event) => { event.preventDefault(); send(input); }}>
        <input type="text" maxLength={MAX_QUESTION} aria-label="질문" autoComplete="off" name="question" placeholder="메시지를 입력하세요…" value={input} onChange={(event) => setInput(event.target.value)} onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }} onKeyDown={(event) => { if (event.key === 'Enter' && !composingRef.current && !event.nativeEvent.isComposing) { event.preventDefault(); send(input); } }} />
        <button type="submit" disabled={isLoading || !input.trim()} aria-label="질문 보내기" aria-busy={isLoading}><TbSend size={19} aria-hidden="true" /></button>
      </form>

      {showClearConfirm && <div className={styles.confirmBackdrop}><div ref={clearDialogRef} role="dialog" aria-modal="true" aria-labelledby="chat-clear-title" className={styles.confirmDialog}><h3 id="chat-clear-title">채팅 내용 초기화</h3><p>모든 대화 내용이 삭제됩니다.<br />정말 초기화하시겠습니까?</p><div className={styles.confirmActions}><button ref={clearCancelRef} type="button" onClick={() => setShowClearConfirm(false)}>취소</button><button type="button" onClick={clearChat}><TbRefresh size={16} aria-hidden="true" /><span>초기화</span></button></div></div></div>}
    </div>
  );

  return presentation !== 'floating' && (isMobile || isTablet) ? createPortal(chatRoomContent, document.body) : chatRoomContent;
};

export default QuestionRecommendationChatRoom;
