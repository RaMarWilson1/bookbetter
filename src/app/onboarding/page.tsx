// src/app/onboarding/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { OnboardingForm } from './_components/onboarding-form';

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in');

  return (
    <OnboardingForm
      userId={session.user.id}
      userName={session.user.name || ''}
      userEmail={session.user.email || ''}
    />
  );
}