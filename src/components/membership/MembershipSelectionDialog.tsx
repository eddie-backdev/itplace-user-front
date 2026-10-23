'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import MembershipProfileSelector from './MembershipProfileSelector';
import { isCarrierCode, isValidCarrierGradePair } from '@/utils/membership';
import styles from './MembershipSelectionDialog.module.css';
import { useReferenceData } from '@/components/ReferenceDataProvider';

export type MembershipSelectionDialogProps = {
  isOpen: boolean;
  carrier: string;
  grade: string;
  onClose: () => void;
  onApply: (carrier: string, grade: string) => void;
};

export default function MembershipSelectionDialog({
  isOpen,
  carrier,
  grade,
  onClose,
  onApply,
}: MembershipSelectionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { data, error, retry } = useReferenceData();
  const [draftCarrier, setDraftCarrier] = useState(carrier);
  const [draftGrade, setDraftGrade] = useState(grade);

  useEffect(() => {
    if (!isOpen) return;
    setDraftCarrier(carrier);
    setDraftGrade(grade);
  }, [carrier, grade, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isCarrierCode(draftCarrier) || !isValidCarrierGradePair(draftCarrier, draftGrade, data)) return;
    onApply(draftCarrier, draftGrade);
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="membership-title"
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className={styles.heading}>
          <div>
            <h2 id="membership-title">내 멤버십 선택</h2>
            <p>선택한 통신사와 등급에 맞는 혜택을 먼저 보여드려요.</p>
          </div>
          <button type="button" className={styles.close} aria-label="닫기" onClick={onClose}>
            ×
          </button>
        </div>
        <MembershipProfileSelector
          carrier={draftCarrier}
          membershipGradeCode={draftGrade}
          onCarrierChange={setDraftCarrier}
          onGradeChange={setDraftGrade}
          variant="cards"
          compact
        />
        <button
          type="submit"
          disabled={
            !isCarrierCode(draftCarrier) || !isValidCarrierGradePair(draftCarrier, draftGrade, data)
          }
          className={styles.submit}
        >
          선택 완료
        </button>
        {error ? <p role="alert">참조 코드 정보를 불러오지 못했습니다. <button type="button" onClick={retry}>다시 시도</button></p> : null}
      </form>
    </dialog>
  );
}
