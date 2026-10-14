import Modal from '../../../../components/Modal';
import SignUpPhoneVerificationForm from '../../../loginPage/components/signup/SignUpPhoneVerificationForm';

type PhoneVerificationModalProps = {
  isOpen: boolean;
  userId: number;
  phoneNumber?: string | null;
  onClose: () => void;
  onVerified: () => void | Promise<void>;
};

export default function PhoneVerificationModal({
  isOpen,
  userId,
  phoneNumber,
  onClose,
  onVerified,
}: PhoneVerificationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title="휴대폰 번호 인증"
      message="휴대폰에서 문자 인증을 완료하면 이 계정에 번호가 등록돼요."
      onClose={onClose}
      widthClass="w-full max-w-[480px]"
    >
      <div className="w-full">
        <SignUpPhoneVerificationForm
          key={userId}
          userId={userId}
          initialPhoneNumber={phoneNumber ?? ''}
          onVerified={onVerified}
        />
      </div>
    </Modal>
  );
}
