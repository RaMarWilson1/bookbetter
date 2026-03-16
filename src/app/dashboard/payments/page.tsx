// src/app/dashboard/payments/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PaymentsContent } from './_components/payments-content';

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in');

  return <PaymentsContent />;
}