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

  return (
    <Modal
      isOpen={isOpen}
      title="멤버십 프로필 변경"
      message="통신사와 멤버십 등급을 선택해 주세요."
      onClose={onClose}
      widthClass="w-full max-w-[520px]"
    >
      <div className="flex w-full max-w-[420px] flex-col gap-5">
        <div className="rounded-[18px] bg-purple01/45 px-5 py-4">
          <p className="text-body-4-bold text-purple03">현재 프로필</p>
          <p className="mt-1 text-body-1-bold text-purple05">
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
          selectClassName="w-full max-xl:w-full max-lg:w-full"
        />

        <p className="text-body-5 text-grey04">
          선택한 정보는 맞춤 혜택 조회 기준으로 사용됩니다. 통신사 실인증 정보는 아니에요.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-[12px] border border-grey02 py-3 text-body-2-bold text-grey04 transition hover:border-grey04 hover:text-grey05 disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => onSave(draftCarrier, draftGrade)}
            className={`flex-1 rounded-[12px] py-3 text-body-2-bold transition ${
              canSave ? 'bg-purple04 text-white hover:bg-purple05' : 'bg-grey01 text-grey03'
            }`}
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
