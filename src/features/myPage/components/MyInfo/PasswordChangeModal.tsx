import Modal from '../../../../components/Modal';
import { useMemo } from 'react';

interface PasswordChangeModalProps {
  isOpen: boolean;
  submitting?: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  onCurrentChange: (val: string) => void;
  onNewChange: (val: string) => void;
  onConfirmChange: (val: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

const specialCharRegex = /[!@#$%^&*()_+{}[\]:;<>,.?~/-]/;

export default function PasswordChangeModal({
  isOpen,
  submitting = false,
  currentPassword,
  newPassword,
  confirmPassword,
  onCurrentChange,
  onNewChange,
  onConfirmChange,
  onCancel,
  onSubmit,
}: PasswordChangeModalProps) {
  const isPasswordValid = useMemo(() => {
    return newPassword.length >= 6 && specialCharRegex.test(newPassword);
  }, [newPassword]);

  const isPasswordMatch = useMemo(() => {
    return confirmPassword === newPassword;
  }, [newPassword, confirmPassword]);

  const isReady =
    !submitting &&
    currentPassword.trim() !== '' &&
    newPassword.trim() !== '' &&
    confirmPassword.trim() !== '' &&
    isPasswordValid &&
    isPasswordMatch;

  return (
    <Modal
      isOpen={isOpen}
      busy={submitting}
      title="비밀번호를 재설정합니다"
      message="현재 비밀번호와 새 비밀번호를 입력해주세요."
      onClose={onCancel}
    >
      <div className="flex flex-col items-center gap-4 w-full max-w-[436px] mt-4">
        {/* 인풋 영역 */}
        <div className="flex flex-col gap-3 w-full">
          <div className="flex flex-col gap-1">
            <label htmlFor="current-password" className="text-body-3 font-semibold text-grey06">
              현재 비밀번호
            </label>
            <input
              id="current-password"
              type="password"
              name="currentPassword"
              autoComplete="current-password"
              className="h-[50px] w-full rounded-[10px] border border-warmBorder bg-grey01 px-4 text-body-2 placeholder:text-grey05 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20"
              placeholder="현재 비밀번호 입력"
              value={currentPassword}
              onChange={(e) => onCurrentChange(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="new-password" className="text-body-3 font-semibold text-grey06">
              새 비밀번호
            </label>
            <input
              id="new-password"
              type="password"
              name="newPassword"
              autoComplete="new-password"
              className="h-[50px] w-full rounded-[10px] border border-warmBorder bg-grey01 px-4 text-body-2 placeholder:text-grey05 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20"
              placeholder="새 비밀번호 입력"
              value={newPassword}
              onChange={(e) => onNewChange(e.target.value)}
              disabled={submitting}
            />
            <p
              className={`text-caption text-left ml-1 ${newPassword && !isPasswordValid ? 'text-red-500' : 'text-grey04'}`}
            >
              6자 이상, 특수문자 1개 이상 포함해야 합니다.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="confirm-new-password" className="text-body-3 font-semibold text-grey06">
              새 비밀번호 확인
            </label>
            <input
              id="confirm-new-password"
              type="password"
              name="confirmNewPassword"
              autoComplete="new-password"
              aria-describedby={confirmPassword && !isPasswordMatch ? 'password-match-error' : undefined}
              className="h-[50px] w-full rounded-[10px] border border-warmBorder bg-grey01 px-4 text-body-2 placeholder:text-grey05 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20"
              placeholder="새 비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => onConfirmChange(e.target.value)}
              disabled={submitting}
            />
            {confirmPassword && !isPasswordMatch && (
              <p id="password-match-error" className="text-caption text-red-500 text-left ml-1">
                비밀번호가 일치하지 않습니다.
              </p>
            )}
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex gap-4 w-full mt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 h-[56px] rounded-[10px] border border-grey02 text-grey06 hover:bg-grey01 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isReady) return;
              onSubmit();
            }}
            disabled={!isReady}
            className={`flex-1 h-[56px] rounded-[10px] text-title-6 transition duration-200 ${
              isReady
                ? 'bg-brand text-white hover:bg-brandStrong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2'
                : 'bg-grey01 text-grey03 cursor-not-allowed'
            }`}
          >
            {submitting ? '변경 중…' : '변경하기'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
