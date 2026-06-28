import { FormEvent, useEffect, useState } from 'react';
import {
  TbMap2,
  TbUser,
  TbLogout,
  TbLogin,
  TbMapPin,
  TbLayoutList,
  TbSparkles,
  TbMail,
  TbInfoCircle,
  TbBook2,
  TbHelpCircle,
  TbFileText,
  TbShieldLock,
} from 'react-icons/tb';
import clsx from 'clsx';
import { useLocation, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import api from '../apis/axiosInstance';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/authSlice';
import { persistor } from '../store';
import { showToast } from '../utils/toast';
import Modal from './Modal';
import { createInquiry } from '../apis/inquiryApi';
import {
  addQuestionRecommendationChatStateListener,
  openQuestionRecommendationChat,
} from '../features/questionRecommendationChat/utils/questionRecommendationChatEvents';

const menus = [
  { id: 'map', label: '잇플 맵', icon: TbMap2, path: '/' },
  { id: 'benefits', label: '전체 혜택', icon: TbLayoutList, path: '/benefits' },
  { id: 'mypage', label: '마이페이지', icon: TbUser, path: '/mypage/info' },
];

const supportMenus = [
  { label: '안내', icon: TbInfoCircle, path: '/about', ariaLabel: '서비스 소개 보기' },
  { label: '가이드', icon: TbBook2, path: '/guide', ariaLabel: '혜택 이용 가이드 보기' },
  { label: 'FAQ', icon: TbHelpCircle, path: '/faq', ariaLabel: '자주 묻는 질문 보기' },
  { label: '문의', icon: TbMail, path: '/contact', ariaLabel: '문의 페이지 보기' },
  { label: '약관', icon: TbFileText, path: '/terms', ariaLabel: '이용약관 보기' },
  { label: '개인정보', icon: TbShieldLock, path: '/privacy', ariaLabel: '개인정보처리방침 보기' },
];

const primaryNavItemClass =
  'relative flex h-[74px] w-[72px] flex-col items-center justify-center rounded-2xl text-white text-title-8 transition hover:bg-white/15 hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70';

const utilityNavItemClass =
  'flex h-[64px] w-[72px] flex-col items-center justify-center rounded-2xl text-white text-title-8 transition hover:bg-white/15 hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70';

const activeNavClass = 'bg-white/25 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]';

const inquiryCategoryOptions = ['오류 신고', '혜택 정보 수정', '제휴 문의', '기타'];

export default function Header({ variant = 'default' }: { variant?: 'default' | 'glass' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const [isQuestionRecommendationOpen, setIsQuestionRecommendationOpen] = useState(false);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isInquirySubmitting, setIsInquirySubmitting] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    category: inquiryCategoryOptions[0],
    title: '',
    content: '',
  });

  useEffect(() => {
    return addQuestionRecommendationChatStateListener(setIsQuestionRecommendationOpen);
  }, []);

  const handleQuestionRecommendationClick = () => {
    if (!isLoggedIn) {
      showToast('질문형 AI 추천은 로그인 후 사용할 수 있습니다.', 'info');
      return;
    }

    openQuestionRecommendationChat();
  };

  const handleContact = () => {
    setIsInquiryOpen(true);
  };

  const handleInquiryChange = (field: keyof typeof inquiryForm, value: string) => {
    setInquiryForm((current) => ({ ...current, [field]: value }));
  };

  const resetInquiryForm = () => {
    setInquiryForm({
      category: inquiryCategoryOptions[0],
      title: '',
      content: '',
    });
  };

  const handleInquiryClose = () => {
    if (isInquirySubmitting) {
      return;
    }

    setIsInquiryOpen(false);
    resetInquiryForm();
  };

  const handleInquirySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = inquiryForm.title.trim();
    const content = inquiryForm.content.trim();
    if (!title || !content) {
      showToast('문의 제목과 내용을 입력해 주세요.', 'error');
      return;
    }

    try {
      setIsInquirySubmitting(true);
      await createInquiry({
        category: inquiryForm.category,
        title,
        content,
      });
      showToast('문의가 등록되었습니다.', 'success');
      setIsInquiryOpen(false);
      resetInquiryForm();
    } catch {
      showToast('문의 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.', 'error');
    } finally {
      setIsInquirySubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      // 로그아웃 API 호출
      await api.post('api/v1/auth/logout');
      // 상태 초기화
      dispatch(logout());
      // redux-persist 초기화
      persistor.purge();
      // 성공 토스트 표시
      showToast('로그아웃 되었습니다.', 'success');
      sessionStorage.removeItem('questionRecommendationChatMessages');
      sessionStorage.removeItem('chatMessages');
      // 페이지 이동
      navigate('/');
    } catch (err) {
      console.error('로그아웃 실패:', err);
      // 실패 토스트 표시
      showToast('로그아웃에 실패했습니다.', 'error');
    }
  };

  return (
    <>
      <aside
        className={clsx(
          'fixed z-30 left-0 top-0 h-full overflow-y-auto scrollbar-hide w-[81px] flex flex-col items-center py-4 rounded-tr-xl rounded-br-xl',
          variant === 'glass' ? 'header-glass bg-[rgba(255,255,255,0.05)]' : 'bg-gradient-header'
        )}
      >
        {/* 로고 영역 */}
        <div className="mb-12 flex flex-col items-center text-white">
          <TbMapPin
            className="text-3xl mb-2 drop-shadow-[0_0_5px_rgba(255,255,255)]"
            strokeWidth={1.3}
          />
          <span className="font-bold text-title-8 drop-shadow-[0_0_5px_rgba(255,255,255,0.6)]">
            IT: PLACE
          </span>
        </div>

        {/* 주요 메뉴 */}
        <nav className="flex-1 flex flex-col items-center gap-y-3">
          {menus.map((m) => {
            const Icon = m.icon;
            const isActive =
              m.id === 'mypage'
                ? location.pathname.startsWith('/mypage')
                : location.pathname === m.path;
            return (
              <Link
                to={m.path}
                key={m.id}
                aria-current={isActive ? 'page' : undefined}
                className={clsx(primaryNavItemClass, isActive && activeNavClass)}
              >
                <Icon className="text-[28px]" strokeWidth={1.35} />
                <span className="mt-1 leading-none">{m.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={handleQuestionRecommendationClick}
            className={clsx(primaryNavItemClass, isQuestionRecommendationOpen && activeNavClass)}
            aria-pressed={isQuestionRecommendationOpen}
            aria-label="질문형 AI 추천 열기"
          >
            <TbSparkles className="text-[28px]" strokeWidth={1.35} />
            <span className="mt-1 leading-none">AI 질문</span>
          </button>
        </nav>

        {/* 보조 액션 */}
        <div className="mb-1 mt-6 flex flex-col items-center gap-y-2 border-t border-white/15 pt-3">
          {supportMenus.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  utilityNavItemClass,
                  location.pathname === item.path && activeNavClass
                )}
                aria-label={item.ariaLabel}
                aria-current={location.pathname === item.path ? 'page' : undefined}
              >
                <Icon className="text-[27px]" strokeWidth={1.35} />
                <span className="mt-1 leading-none">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={handleContact}
            className={utilityNavItemClass}
            aria-label="빠른 문의 남기기"
          >
            <TbMail className="text-[27px]" strokeWidth={1.35} />
            <span className="mt-1 leading-none">제보</span>
          </button>

          {isLoggedIn ? (
            <button className={utilityNavItemClass} onClick={handleLogout} aria-label="로그아웃">
              <TbLogout className="text-[27px]" strokeWidth={1.35} />
              <span className="mt-1 leading-none">로그아웃</span>
            </button>
          ) : (
            <button
              onClick={() => {
                navigate('/login', {
                  state: { resetToLogin: true },
                  replace: true,
                });
              }}
              className={utilityNavItemClass}
            >
              <TbLogin className="text-[27px]" strokeWidth={1.35} />
              <span className="mt-1 leading-none">로그인</span>
            </button>
          )}
        </div>
      </aside>

      <Modal
        isOpen={isInquiryOpen}
        title="문의 남기기"
        onClose={handleInquiryClose}
        widthClass="w-full max-w-[560px]"
      >
        <form onSubmit={handleInquirySubmit} className="flex w-full flex-col gap-4 text-left">
          <label className="flex flex-col gap-2 text-body-2 text-black">
            문의 유형
            <select
              value={inquiryForm.category}
              onChange={(event) => handleInquiryChange('category', event.target.value)}
              className="h-[46px] rounded-[10px] bg-grey01 px-4 text-body-2 text-grey05 outline-none focus:ring-2 focus:ring-purple02"
              disabled={isInquirySubmitting}
            >
              {inquiryCategoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-body-2 text-black">
            제목
            <input
              value={inquiryForm.title}
              onChange={(event) => handleInquiryChange('title', event.target.value)}
              maxLength={200}
              placeholder="문의 제목을 입력해 주세요"
              className="h-[46px] rounded-[10px] bg-grey01 px-4 text-body-2 text-grey05 placeholder-grey03 outline-none focus:ring-2 focus:ring-purple02"
              disabled={isInquirySubmitting}
            />
          </label>

          <label className="flex flex-col gap-2 text-body-2 text-black">
            문의 내용
            <textarea
              value={inquiryForm.content}
              onChange={(event) => handleInquiryChange('content', event.target.value)}
              maxLength={4000}
              placeholder="게시글을 작성하듯 문의 내용을 남겨주세요"
              className="min-h-[150px] resize-none rounded-[10px] bg-grey01 px-4 py-3 text-body-2 text-grey05 placeholder-grey03 outline-none focus:ring-2 focus:ring-purple02"
              disabled={isInquirySubmitting}
            />
          </label>

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={handleInquiryClose}
              className="h-[52px] flex-1 rounded-[10px] border border-grey02 text-title-6 text-grey04 transition hover:border-grey04 hover:text-grey05"
              disabled={isInquirySubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="h-[52px] flex-1 rounded-[10px] bg-purple04 text-title-6 text-white transition hover:bg-purple05 disabled:cursor-not-allowed disabled:bg-grey03"
              disabled={isInquirySubmitting}
            >
              {isInquirySubmitting ? '접수 중' : '문의 등록'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
