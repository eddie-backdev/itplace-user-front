import { useEffect, useState } from 'react';
import Modal from '../../../../components/Modal';
import MembershipProfileSelector from '../../../../components/membership/MembershipProfileSelector';
import { getCarrierLabel, getMembershipGradeLabel } from '../../../../utils/membership';

type MembershipProfileModalProps = {
  isOpen: boolean;
  carrier?: string | null;
  membershipGradeCode?: string | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (carrier: string, membershipGradeCode: string) => void;
};

export default function MembershipProfileModal({
  isOpen,
  carrier,
  membershipGradeCode,
  saving = false,
  onClose,
  onSave,
}: MembershipProfileModalProps) {
  const [draftCarrier, setDraftCarrier] = useState(carrier ?? '');
  const [draftGrade, setDraftGrade] = useState(membershipGradeCode ?? '');

  useEffect(() => {
    if (!isOpen) return;
    setDraftCarrier(carrier ?? '');
    setDraftGrade(membershipGradeCode ?? '');
  }, [carrier, membershipGradeCode, isOpen]);

  const hasChanges = draftCarrier !== (carrier ?? '') || draftGrade !== (membershipGradeCode ?? '');
  const canSave = Boolean(draftCarrier && draftGrade && hasChanges && !saving);
  const isProfileRegistered = Boolean(carrier && membershipGradeCode);

  return (
    <Modal
      isOpen={isOpen}
      busy={saving}
      title={isProfileRegistered ? '멤버십 프로필 변경' : '멤버십 프로필 등록'}
      message="통신사와 멤버십 등급을 선택해 주세요."
      onClose={onClose}
      widthClass="w-full max-w-[520px]"
    >
      <div className="flex w-full max-w-[420px] flex-col gap-4">
        <div className="rounded-xl bg-warmCanvas px-4 py-3">
          <p className="text-sm font-semibold text-grey05">현재 프로필</p>
          <p className="mt-1 text-base font-semibold text-ink">
            {carrier && membershipGradeCode
              ? `${getCarrierLabel(carrier)} · ${getMembershipGradeLabel(membershipGradeCode)}`
              : '아직 선택하지 않았어요'}
          </p>
        </div>

        <MembershipProfileSelector
          carrier={draftCarrier}
          membershipGradeCode={draftGrade}
          onCarrierChange={setDraftCarrier}
          onGradeChange={setDraftGrade}
          disabled={saving}
          className="items-stretch"
          selectClassName="min-h-11 w-full !text-base max-xl:w-full max-lg:w-full"
        />

        <p className="text-sm leading-6 text-grey05">
          선택한 정보는 맞춤 혜택 조회 기준으로 사용됩니다. 통신사 실인증 정보는 아니에요.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-h-11 flex-1 rounded-lg border border-warmBorder px-3 text-base font-semibold text-grey05 transition hover:bg-warmCanvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => onSave(draftCarrier, draftGrade)}
            className={`min-h-11 flex-1 rounded-lg px-3 text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed ${
              canSave ? 'bg-brand text-white hover:bg-brandStrong' : 'bg-grey01 text-grey03'
            }`}
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
