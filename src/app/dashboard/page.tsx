// src/app/dashboard/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { OverviewContent } from './_components/overview-content';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in');

  return <OverviewContent userName={session.user.name || 'there'} />;
}