// src/app/dashboard/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { staffAccounts, tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { OverviewContent } from './_components/overview-content';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in');

  // Get tenant slug for booking link
  let tenantSlug: string | null = null;
  const [staff] = await db
    .select({ tenantId: staffAccounts.tenantId })
    .from(staffAccounts)
    .where(eq(staffAccounts.userId, session.user.id))
    .limit(1);

  if (staff) {
    const [t] = await db
      .select({ slug: tenants.slug })
      .from(tenants)
      .where(eq(tenants.id, staff.tenantId))
      .limit(1);
    tenantSlug = t?.slug || null;
  }

  return (
    <OverviewContent
      userName={session.user.name || 'there'}
      tenantSlug={tenantSlug}
    />
  );
}