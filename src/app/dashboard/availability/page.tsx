// src/app/dashboard/availability/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { availabilityTemplates, availabilityExceptions, staffAccounts } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { AvailabilityContent } from './_components/availability-content';

async function getAvailabilityData(userId: string) {
  const staffRecord = await db
    .select({ tenantId: staffAccounts.tenantId })
    .from(staffAccounts)
    .where(eq(staffAccounts.userId, userId))
    .limit(1);

  if (!staffRecord[0]) return { tenantId: null, templates: [], exceptions: [] };

  const tenantId = staffRecord[0].tenantId;

  const templates = await db
    .select()
    .from(availabilityTemplates)
    .where(eq(availabilityTemplates.tenantId, tenantId));

  const exceptions = await db
    .select()
    .from(availabilityExceptions)
    .where(
      and(
        eq(availabilityExceptions.tenantId, tenantId),
        gte(availabilityExceptions.endUtc, new Date())
      )
    );

  return { tenantId, templates, exceptions };
}

export default async function AvailabilityPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in');

  const data = await getAvailabilityData(session.user.id);

  return (
    <AvailabilityContent
      tenantId={data.tenantId}
      templates={data.templates}
      exceptions={data.exceptions}
    />
  );
}