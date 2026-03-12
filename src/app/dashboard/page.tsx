// src/app/dashboard/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { staffAccounts, tenants, bookings } from '@/db/schema';
import { eq, and, gte, count } from 'drizzle-orm';
import { OverviewContent } from './_components/overview-content';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in');

  // Get tenant info
  let tenantSlug: string | null = null;
  let plan = 'starter';
  let bookingsQuota = 15;
  let bookingsUsed = 0;
  let tenantId: string | null = null;

  const [staff] = await db
    .select({ tenantId: staffAccounts.tenantId })
    .from(staffAccounts)
    .where(eq(staffAccounts.userId, session.user.id))
    .limit(1);

  if (staff) {
    tenantId = staff.tenantId;
    const [t] = await db
      .select({
        slug: tenants.slug,
        plan: tenants.plan,
        bookingsQuota: tenants.bookingsQuota,
      })
      .from(tenants)
      .where(eq(tenants.id, staff.tenantId))
      .limit(1);

    if (t) {
      tenantSlug = t.slug || null;
      plan = t.plan || 'starter';
      bookingsQuota = t.bookingsQuota || 15;
    }

    // Count bookings this month for Starter plan
    if (plan === 'starter' && tenantId) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [monthCount] = await db
        .select({ count: count() })
        .from(bookings)
        .where(
          and(
            eq(bookings.tenantId, tenantId),
            gte(bookings.createdAt, startOfMonth)
          )
        );

      bookingsUsed = monthCount?.count || 0;
    }
  }

  return (
    <OverviewContent
      userName={session.user.name || 'there'}
      tenantSlug={tenantSlug}
      plan={plan}
      bookingsUsed={bookingsUsed}
      bookingsLimit={bookingsQuota}
    />
  );
}