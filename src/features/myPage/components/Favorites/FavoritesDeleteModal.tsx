// src/features/myPage/components/FavoritesDeleteModal.tsx
import Modal from '../../../../components/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}
export default function FavoritesDeleteModal({ isOpen, onClose, onConfirm }: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="관심 혜택에서 제외할까요?"
      message="관심 혜택 목록에서 삭제됩니다. 전체 혜택에서 다시 저장할 수 있어요."
      buttons={[
        { label: '취소', type: 'secondary', onClick: onClose },
        { label: '관심 해제', type: 'primary', onClick: onConfirm },
      ]}
    />
  );
}
