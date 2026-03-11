// src/app/onboarding/layout.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { staffAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const metadata = {
  title: 'Set Up Your Business — BookBetter',
};

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/sign-in');
  }

  // If user already has a tenant, skip onboarding
  const existing = await db
    .select({ tenantId: staffAccounts.tenantId })
    .from(staffAccounts)
    .where(eq(staffAccounts.userId, session.user.id))
    .limit(1);

  if (existing[0]) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200/60 flex items-center px-6">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">
          Book<span className="text-blue-500">Better</span>
        </h1>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center pt-8 sm:pt-16 px-4 pb-16">
        <div className="w-full max-w-xl">
          {children}
        </div>
      </main>
    </div>
  );
}