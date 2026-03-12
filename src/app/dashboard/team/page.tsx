// src/app/dashboard/team/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { tenants, staffAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { TeamContent } from './_components/team-content';

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in');

  const [staff] = await db
    .select({
      tenantId: staffAccounts.tenantId,
      role: staffAccounts.role,
    })
    .from(staffAccounts)
    .where(eq(staffAccounts.userId, session.user.id))
    .limit(1);

  if (!staff) redirect('/onboarding');

  const [tenant] = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      plan: tenants.plan,
    })
    .from(tenants)
    .where(eq(tenants.id, staff.tenantId))
    .limit(1);

  if (!tenant) redirect('/onboarding');

  return (
    <TeamContent
      tenantName={tenant.name}
      plan={tenant.plan}
      currentUserRole={staff.role}
      currentUserId={session.user.id}
    />
  );
}