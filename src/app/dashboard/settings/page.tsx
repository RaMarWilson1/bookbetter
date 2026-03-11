// src/app/dashboard/settings/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users, tenants, staffAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { SettingsContent } from './_components/settings-content';

async function getSettingsData(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const staffRecord = await db
    .select({ tenantId: staffAccounts.tenantId })
    .from(staffAccounts)
    .where(eq(staffAccounts.userId, userId))
    .limit(1);

  let tenant = null;
  if (staffRecord[0]) {
    const [t] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, staffRecord[0].tenantId))
      .limit(1);
    tenant = t;
  }

  return { user, tenant };
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in');

  const data = await getSettingsData(session.user.id);

  return <SettingsContent user={data.user} tenant={data.tenant} />;
}