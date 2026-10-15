import { notFound } from 'next/navigation';
import SignupPreview from './SignupPreview';

type SignupPreviewPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SignupPreviewPage({ searchParams }: SignupPreviewPageProps) {
  if (process.env.NODE_ENV !== 'development') notFound();

  const screen = (await searchParams).screen;
  const selectedScreen = Array.isArray(screen) ? screen[0] : screen;
  const cleanScreen =
    selectedScreen === 'account' || selectedScreen === 'member' || selectedScreen === 'complete';
  const initialStep =
    selectedScreen === 'account'
      ? 1
      : selectedScreen === 'complete'
        ? 3
        : selectedScreen === 'member'
          ? 2
          : 1;

  return (
    <SignupPreview
      key={cleanScreen ? `clean-${selectedScreen}` : 'walkthrough'}
      cleanScreen={cleanScreen}
      initialStep={initialStep}
    />
  );
}
