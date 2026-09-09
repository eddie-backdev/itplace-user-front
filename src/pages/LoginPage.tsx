import AuthLayout from '../features/loginPage/layouts/AuthLayout';
import PageSeo from '../components/PageSeo';

const LoginPage = () => {
  return (
    <>
      <PageSeo
        title="로그인 | 잇플레이스"
        description="잇플레이스에 로그인해 회원 정보와 관심 혜택을 관리하세요."
        path="/login"
        noIndex
      />
      <AuthLayout />
    </>
  );
};

export default LoginPage;
