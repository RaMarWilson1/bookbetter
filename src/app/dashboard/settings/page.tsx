// src/app/dashboard/settings/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users, staffAccounts, tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { SettingsContent } from './_components/settings-content';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in');

  // Get user
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      timeZone: users.timeZone,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) redirect('/auth/sign-in');

  // Get tenant via staffAccounts
  let tenant = null;
  const [staff] = await db
    .select({ tenantId: staffAccounts.tenantId })
    .from(staffAccounts)
    .where(eq(staffAccounts.userId, user.id))
    .limit(1);

  if (staff) {
    const [t] = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        description: tenants.description,
        email: tenants.email,
        phone: tenants.phone,
        address: tenants.address,
        city: tenants.city,
        state: tenants.state,
        postalCode: tenants.postalCode,
        timeZone: tenants.timeZone,
        plan: tenants.plan,
        primaryColor: tenants.primaryColor,
        secondaryColor: tenants.secondaryColor,
        logo: tenants.logo,
        cancellationWindowHours: tenants.cancellationWindowHours,
        lateCancellationFeeCents: tenants.lateCancellationFeeCents,
        cancellationPolicyText: tenants.cancellationPolicyText,
      })
      .from(tenants)
      .where(eq(tenants.id, staff.tenantId))
      .limit(1);

    tenant = t || null;
  }

  return <SettingsContent user={user} tenant={tenant} />;
}