// src/pages/myPage/MyInfoPage.tsx
import { useCallback, useEffect, useState } from 'react';
import MyPageContentLayout from '../../features/myPage/layout/MyPageContentLayout';
import UserInfoForm from '../../features/myPage/components/MyInfo/UserInfoForm';
import MembershipInfo from '../../features/myPage/components/MyInfo/MembershipInfo';
import FadeWrapper from '../../features/myPage/components/FadeWrapper';
import PasswordChangeModal from '../../features/myPage/components/MyInfo/PasswordChangeModal';
import UserDeleteModal from '../../features/myPage/components/MyInfo/UserDeleteModal';
import MembershipProfileModal from '../../features/myPage/components/MyInfo/MembershipProfileModal';
import api from '../../apis/axiosInstance';
import LoadingSpinner from '../../components/LoadingSpinner';
import NoResult from '../../components/NoResult';
import { showToast } from '../../utils/toast';
import { AxiosError } from 'axios';
import { useDispatch } from 'react-redux';
import { logout, setLoginSuccess } from '../../store/authSlice';
import { useNavigate } from 'react-router-dom';
import { isValidCarrierGradePair } from '../../utils/membership';

interface UserInfo {
  id: number;
  nickname: string;
  email: string;
  phoneNumber: string;
  gender: string;
  birthday: string;
  carrier: string | null;
  membershipGrade: string | null;
  membershipGradeCode: string | null;
  membershipVerified?: boolean;
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

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [password, setPassword] = useState('');

  const [membershipModalOpen, setMembershipModalOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

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

  // ✅ 로딩중일 경우
  if (loading) {
    return (
      <div className="flex h-[640px] flex-row items-stretch gap-4 w-full max-md:h-auto max-md:flex-col-reverse max-md:px-5 max-md:pb-7">
        <MyPageContentLayout
          main={
            <div className="flex justify-center items-center min-h-[220px]">
              <LoadingSpinner />
            </div>
          }
          aside={<></>}
        />
      </div>
    );
  }

  // ✅ user가 없을 경우
  if (!user) {
    return (
      <div className="flex h-[640px] flex-row items-stretch gap-4 w-full max-md:h-auto max-md:flex-col-reverse max-md:px-5 max-md:pb-7">
        <MyPageContentLayout
          main={
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
          }
          aside={<></>}
        />
      </div>
    );
  }

  const handleMembershipProfileSave = async (carrier: string, membershipGradeCode: string) => {
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

  return (
    <div className="flex h-[640px] flex-row items-stretch gap-4 w-full max-lg:h-auto max-lg:flex-col max-md:flex-col-reverse max-md:px-5 max-md:pb-7 max-md:pt-3">
      <MyPageContentLayout
        main={
          <div className="min-h-0 flex-1">
            <div className="mb-4 max-md:hidden">
              <p className="text-body-3-bold text-purple03">MY INFO</p>
              <h1 className="mt-1 text-title-4 font-semibold text-black">회원 정보</h1>
              <p className="mt-1.5 text-body-3 text-grey04">
                기본 회원 정보를 확인하고 수정할 수 있어요.
              </p>
            </div>
            <UserInfoForm
              nickname={user.nickname}
              gender={user.gender}
              birthday={user.birthday}
              phoneNumber={user.phoneNumber}
              email={user.email}
              onChangePasswordClick={() => setIsPwModalOpen(true)}
              onDeleteClick={() => setDeleteModalOpen(true)}
            />
          </div>
        }
        aside={
          <FadeWrapper
            changeKey={`${user.carrier ?? 'none'}-${user.membershipGradeCode ?? user.membershipGrade ?? 'none'}`}
          >
            <MembershipInfo
              nickname={user.nickname}
              carrier={user.carrier}
              grade={user.membershipGradeCode ?? user.membershipGrade}
              verified={user.membershipVerified}
              onChangeProfileClick={() => setMembershipModalOpen(true)}
            />
          </FadeWrapper>
        }
      />
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
        currentPassword={currentPw}
        newPassword={newPw}
        confirmPassword={confirmPw}
        onCurrentChange={setCurrentPw}
        onNewChange={setNewPw}
        onConfirmChange={setConfirmPw}
        onCancel={() => {
          setIsPwModalOpen(false);
          setCurrentPw('');
          setNewPw('');
          setConfirmPw('');
        }}
        onSubmit={async () => {
          try {
            await api.patch('api/v1/users/changePassword', {
              oldPassword: currentPw,
              newPassword: newPw,
              newPasswordConfirm: confirmPw,
            });
            showToast('비밀번호가 성공적으로 변경되었습니다.', 'success');
          } catch (err) {
            // 👉 에러 코드별 토스트 처리
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
            setIsPwModalOpen(false);
            setCurrentPw('');
            setNewPw('');
            setConfirmPw('');
          }
        }}
      />
      {/* 회원탈퇴 */}
      <UserDeleteModal
        isOpen={deleteModalOpen}
        password={password}
        requiresPassword={user.hasLocalPassword !== false}
        onPasswordChange={setPassword}
        onCancel={() => {
          setDeleteModalOpen(false);
          setPassword('');
        }}
        onDelete={async () => {
          try {
            await api.delete('api/v1/users', {
              data: user.hasLocalPassword === false ? {} : { password },
            });

            showToast('회원 탈퇴가 완료되었습니다.', 'success');

            // 로그인 상태 초기화
            dispatch(logout());

            // 로그인 페이지로 이동
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
            setDeleteModalOpen(false);
            setPassword('');
          }
        }}
      />
    </div>
  );
}
