// src/app/my-bookings/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MyBookingsContent } from './_components/my-bookings-content';

export const dynamic = 'force-dynamic';

export default async function MyBookingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/sign-in?callbackUrl=/my-bookings');
  }

  return <MyBookingsContent user={session.user} />;
}