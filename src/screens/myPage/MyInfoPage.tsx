// src/pages/myPage/MyInfoPage.tsx
import { useCallback, useEffect, useState } from 'react';
import UserInfoForm from '../../features/myPage/components/MyInfo/UserInfoForm';
import MembershipInfo from '../../features/myPage/components/MyInfo/MembershipInfo';
import PasswordChangeModal from '../../features/myPage/components/MyInfo/PasswordChangeModal';
import UserDeleteModal from '../../features/myPage/components/MyInfo/UserDeleteModal';
import MembershipProfileModal from '../../features/myPage/components/MyInfo/MembershipProfileModal';
import PhoneVerificationModal from '../../features/myPage/components/MyInfo/PhoneVerificationModal';
import api from '../../apis/axiosInstance';
import LoadingSpinner from '../../components/LoadingSpinner';
import NoResult from '../../components/NoResult';
import { showToast } from '../../utils/toast';
import { AxiosError } from 'axios';
import { useDispatch } from 'react-redux';
import { logout, setLoginSuccess } from '../../store/authSlice';
import { useNavigate } from '@/lib/navigation';
import { isValidCarrierGradePair } from '../../utils/membership';

interface UserInfo {
  id: number;
  nickname: string;
  email: string | null;
  phoneNumber: string | null;
  gender: string | null;
  birthday: string | null;
  carrier: string | null;
  membershipGrade: string | null;
  membershipGradeCode: string | null;
  membershipVerified?: boolean;
  phoneVerified?: boolean;
  hasLocalPassword?: boolean;
  socialAccount?: boolean;
}

export default function MyInfoPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [isPwModalOpen, setIsPwModalOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [accountDeleting, setAccountDeleting] = useState(false);

  const [membershipModalOpen, setMembershipModalOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [phoneVerificationModalOpen, setPhoneVerificationModalOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ✅ 사용자 정보 조회
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const res = await api.get<{ data: UserInfo }>('api/v1/users');
      setUser(res.data.data);
    } catch {
      setUser(null);
      setLoadError(true);
      showToast('사용자 정보 조회에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handlePhoneVerificationComplete = useCallback(async () => {
    await fetchUser();
    setPhoneVerificationModalOpen(false);
  }, [fetchUser]);

  const pageHeader = (
    <header>
      <h1 className="text-title-4 font-semibold text-ink max-md:text-title-5">
        회원 정보와 멤버십
      </h1>
      <p className="mt-1.5 text-sm leading-6 text-grey05">
        계정 정보를 확인하고, 혜택을 볼 멤버십 프로필을 설정할 수 있어요.
      </p>
    </header>
  );

  // Keep the page title visible in loading and error states on every screen size.
  if (loading) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-5 pb-8 max-md:px-4">
        {pageHeader}
        <div
          role="status"
          aria-label="회원 정보를 불러오는 중"
          className="flex min-h-[220px] items-center justify-center"
        >
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // User information may be absent when the initial request fails.
  if (!user) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-5 pb-8 max-md:px-4">
        {pageHeader}
        <div className="flex min-h-[220px] items-center justify-center">
          <NoResult
            variant="error"
            message1="회원 정보를 불러오지 못했어요"
            message2={
              loadError
                ? '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'
                : '잠시 후 다시 확인해 주세요.'
            }
            buttonText="다시 시도"
            onButtonClick={fetchUser}
            message1FontSize="text-title-5 max-xl:text-title-6"
            message2FontSize="text-body-2 max-xl:text-body-3"
          />
        </div>
      </div>
    );
  }

  const handleMembershipProfileSave = async (carrier: string, membershipGradeCode: string) => {
    if (profileSaving) return;
    if (!isValidCarrierGradePair(carrier, membershipGradeCode)) {
      showToast('통신사에 맞는 멤버십 등급을 선택해 주세요.', 'error');
      return;
    }

    try {
      setProfileSaving(true);
      await api.patch('api/v1/users/membership-profile', {
        carrier,
        membershipGradeCode,
      });
      showToast('멤버십 프로필이 저장되었습니다.', 'success');
      setMembershipModalOpen(false);
      setUser((prev) =>
        prev
          ? {
              ...prev,
              carrier,
              membershipGrade: membershipGradeCode,
              membershipGradeCode,
              membershipVerified: false,
            }
          : prev
      );
      dispatch(
        setLoginSuccess({
          nickname: user.nickname,
          carrier,
          membershipGrade: membershipGradeCode,
          membershipGradeCode,
          membershipVerified: false,
        })
      );
      fetchUser();
    } catch {
      showToast('멤버십 프로필 저장에 실패했습니다.', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const closePasswordChangeModal = () => {
    if (passwordChanging) return;

    setIsPwModalOpen(false);
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
  };

  const handlePasswordChange = async () => {
    if (passwordChanging) return;

    try {
      setPasswordChanging(true);
      await api.patch('api/v1/users/changePassword', {
        oldPassword: currentPw,
        newPassword: newPw,
        newPasswordConfirm: confirmPw,
      });
      showToast('비밀번호가 성공적으로 변경되었습니다.', 'success');
      setIsPwModalOpen(false);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      const axiosErr = err as AxiosError<{ code: string }>;
      const code = axiosErr.response?.data?.code;
      if (code === 'PASSWORD_MISMATCH') {
        showToast('현재 비밀번호가 일치하지 않습니다.', 'error');
      } else if (code === 'UNAUTHORIZED_ACCESS') {
        showToast('인증이 유효하지 않습니다. 다시 로그인해 주세요.', 'error');
      } else {
        showToast('비밀번호 변경에 실패했습니다.', 'error');
      }
    } finally {
      setPasswordChanging(false);
    }
  };

  const closeUserDeleteModal = () => {
    if (accountDeleting) return;

    setDeleteModalOpen(false);
    setPassword('');
  };

  const handleUserDelete = async () => {
    if (accountDeleting) return;

    try {
      setAccountDeleting(true);
      await api.delete('api/v1/users', {
        data: user.hasLocalPassword === false ? {} : { password },
      });

      showToast('회원 탈퇴가 완료되었습니다.', 'success');
      setDeleteModalOpen(false);
      setPassword('');
      dispatch(logout());
      navigate('/login');
    } catch (err) {
      const axiosErr = err as AxiosError<{ code?: string }>;
      const code = axiosErr.response?.data?.code;

      if (code === 'PASSWORD_MISMATCH') {
        showToast('비밀번호가 일치하지 않습니다.', 'error');
      } else if (code === 'USER_NOT_FOUND') {
        showToast('사용자 정보를 찾을 수 없습니다.', 'error');
      } else {
        showToast('회원 탈퇴에 실패했습니다.', 'error');
      }
    } finally {
      setAccountDeleting(false);
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5 pb-8 max-md:px-4">
      {pageHeader}
      <div className="flex flex-col gap-5 wide:grid wide:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] wide:items-start">
        <MembershipInfo
          carrier={user.carrier}
          grade={user.membershipGradeCode ?? user.membershipGrade}
          verified={user.membershipVerified}
          saving={profileSaving}
          onChangeProfileClick={() => setMembershipModalOpen(true)}
        />
        <UserInfoForm
          nickname={user.nickname}
          gender={user.gender}
          birthday={user.birthday}
          phoneNumber={user.phoneNumber}
          phoneVerified={user.phoneVerified ?? Boolean(user.phoneNumber)}
          email={user.email}
          hasLocalPassword={user.hasLocalPassword}
          socialAccount={user.socialAccount}
          onChangePasswordClick={() => setIsPwModalOpen(true)}
          onPhoneVerificationClick={() => setPhoneVerificationModalOpen(true)}
          onDeleteClick={() => setDeleteModalOpen(true)}
        />
      </div>
      <MembershipProfileModal
        isOpen={membershipModalOpen}
        carrier={user.carrier}
        membershipGradeCode={user.membershipGradeCode ?? user.membershipGrade}
        saving={profileSaving}
        onClose={() => {
          if (!profileSaving) {
            setMembershipModalOpen(false);
          }
        }}
        onSave={handleMembershipProfileSave}
      />
      {/* 비밀번호 변경 */}
      <PasswordChangeModal
        isOpen={isPwModalOpen}
        submitting={passwordChanging}
        currentPassword={currentPw}
        newPassword={newPw}
        confirmPassword={confirmPw}
        onCurrentChange={setCurrentPw}
        onNewChange={setNewPw}
        onConfirmChange={setConfirmPw}
        onCancel={closePasswordChangeModal}
        onSubmit={handlePasswordChange}
      />
      {/* 회원탈퇴 */}
      <UserDeleteModal
        isOpen={deleteModalOpen}
        submitting={accountDeleting}
        password={password}
        requiresPassword={user.hasLocalPassword !== false}
        onPasswordChange={setPassword}
        onCancel={closeUserDeleteModal}
        onDelete={handleUserDelete}
      />
      <PhoneVerificationModal
        isOpen={phoneVerificationModalOpen}
        userId={user.id}
        phoneNumber={user.phoneNumber}
        onClose={() => setPhoneVerificationModalOpen(false)}
        onVerified={handlePhoneVerificationComplete}
      />
    </div>
  );
}
