// src/app/dashboard/appointments/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { bookings, services, users, staffAccounts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { AppointmentsContent } from './_components/appointments-content';

async function getAppointments(userId: string) {
  const staffRecord = await db
    .select({ tenantId: staffAccounts.tenantId })
    .from(staffAccounts)
    .where(eq(staffAccounts.userId, userId))
    .limit(1);

  if (!staffRecord[0]) return [];

  const results = await db
    .select({
      id: bookings.id,
      startUtc: bookings.startUtc,
      endUtc: bookings.endUtc,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      clientName: bookings.clientName,
      clientEmail: bookings.clientEmail,
      clientPhone: bookings.clientPhone,
      clientNotes: bookings.clientNotes,
      internalNotes: bookings.internalNotes,
      createdAt: bookings.createdAt,
      serviceName: services.name,
      serviceDuration: services.durationMinutes,
      servicePriceCents: services.priceCents,
    })
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.tenantId, staffRecord[0].tenantId))
    .orderBy(desc(bookings.startUtc))
    .limit(100);

  return results;
}

export default async function AppointmentsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in');

  const appointments = await getAppointments(session.user.id);

  return <AppointmentsContent appointments={appointments} />;
}