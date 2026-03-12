// src/app/dashboard/settings/billing/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { tenants, staffAccounts, bookings } from '@/db/schema';
import { eq, and, gte, count } from 'drizzle-orm';
import { BillingContent } from './_components/billing-content';

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in');

  const [staff] = await db
    .select({ tenantId: staffAccounts.tenantId, role: staffAccounts.role })
    .from(staffAccounts)
    .where(eq(staffAccounts.userId, session.user.id))
    .limit(1);

  if (!staff) redirect('/onboarding');

  const [tenant] = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      plan: tenants.plan,
      planStartedAt: tenants.planStartedAt,
      planEndsAt: tenants.planEndsAt,
      stripeCustomerId: tenants.stripeCustomerId,
      stripeSubscriptionId: tenants.stripeSubscriptionId,
      bookingsQuota: tenants.bookingsQuota,
      smsQuota: tenants.smsQuota,
      smsUsed: tenants.smsUsed,
    })
    .from(tenants)
    .where(eq(tenants.id, staff.tenantId))
    .limit(1);

  if (!tenant) redirect('/onboarding');

  // Count bookings this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [bookingCount] = await db
    .select({ count: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.tenantId, tenant.id),
        gte(bookings.createdAt, startOfMonth)
      )
    );

  // Count active staff
  const [staffCount] = await db
    .select({ count: count() })
    .from(staffAccounts)
    .where(
      and(
        eq(staffAccounts.tenantId, tenant.id),
        eq(staffAccounts.active, true)
      )
    );

  return (
    <BillingContent
      tenant={{
        ...tenant,
        bookingsQuota: tenant.bookingsQuota || 15,
        smsQuota: tenant.smsQuota || 0,
        smsUsed: tenant.smsUsed || 0,
      }}
      usage={{
        bookingsThisMonth: bookingCount?.count || 0,
        activeStaff: staffCount?.count || 0,
      }}
      isOwner={staff.role === 'owner'}
    />
  );
}