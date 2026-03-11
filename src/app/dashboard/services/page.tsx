// src/app/dashboard/services/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { services, tenants, staffAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ServicesContent } from './_components/services-content';

async function getTenantAndServices(userId: string) {
  // Find the tenant this user owns/manages
  const staffRecord = await db
    .select({ tenantId: staffAccounts.tenantId })
    .from(staffAccounts)
    .where(eq(staffAccounts.userId, userId))
    .limit(1);

  if (!staffRecord[0]) return { tenant: null, services: [] };

  const tenantId = staffRecord[0].tenantId;

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  const serviceList = await db
    .select()
    .from(services)
    .where(eq(services.tenantId, tenantId));

  return { tenant, services: serviceList };
}

export default async function ServicesPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in');

  const data = await getTenantAndServices(session.user.id);

  return <ServicesContent services={data.services} tenantId={data.tenant?.id} />;
}