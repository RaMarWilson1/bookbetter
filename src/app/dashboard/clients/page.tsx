// src/app/dashboard/clients/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { bookings, users, staffAccounts } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { ClientsContent } from './_components/clients-content';

async function getClients(userId: string) {
  const staffRecord = await db
    .select({ tenantId: staffAccounts.tenantId })
    .from(staffAccounts)
    .where(eq(staffAccounts.userId, userId))
    .limit(1);

  if (!staffRecord[0]) return [];

  // Get unique clients from bookings
  const clients = await db
    .select({
      clientId: bookings.clientId,
      clientName: bookings.clientName,
      clientEmail: bookings.clientEmail,
      clientPhone: bookings.clientPhone,
      totalBookings: sql<number>`count(*)::int`,
      lastBooking: sql<Date>`max(${bookings.startUtc})`,
      totalSpentCents: sql<number>`coalesce(sum(case when ${bookings.status} = 'completed' then 1 else 0 end)::int, 0)`,
    })
    .from(bookings)
    .where(eq(bookings.tenantId, staffRecord[0].tenantId))
    .groupBy(bookings.clientId, bookings.clientName, bookings.clientEmail, bookings.clientPhone)
    .orderBy(desc(sql`max(${bookings.startUtc})`));

  return clients;
}

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in');

  const clients = await getClients(session.user.id);

  return <ClientsContent clients={clients} />;
}