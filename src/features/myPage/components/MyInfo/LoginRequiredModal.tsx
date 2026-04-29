import Modal from '../../../../components/Modal';
import { useNavigate } from 'react-router-dom';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginRequiredModal({ isOpen, onClose }: LoginRequiredModalProps) {
  const navigate = useNavigate();

  return (
    <Modal
      isOpen={isOpen}
      title="로그인 후 이용해 주세요"
      message="마이페이지는 로그인 후에만 접근 가능합니다."
      onClose={onClose}
      buttons={[
        {
          label: '로그인하기',
          type: 'primary',
          onClick: () => {
            onClose();
            navigate('/login', { replace: true, state: { resetToLogin: true } });
          },
        },
      ]}
    />
  );
}
