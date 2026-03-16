// src/app/api/cron/reminders/route.ts
// Vercel Cron: runs every hour to send 24h reminders
// Add to vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 * * * *" }] }

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { eq, and, or, gte, lte } from 'drizzle-orm';
import { notifyReminder24h } from '@/lib/notifications';
import { smsReminderClient } from '@/lib/sms-notifications';

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    // Find bookings starting between 23 and 25 hours from now
    // This 2-hour window ensures we catch everything even if cron is slightly delayed
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const upcomingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          or(
            eq(bookings.status, 'pending'),
            eq(bookings.status, 'confirmed')
          ),
          gte(bookings.startUtc, windowStart),
          lte(bookings.startUtc, windowEnd),
          eq(bookings.reminderSent24h, false)
        )
      );

    let sent = 0;
    let failed = 0;

    for (const booking of upcomingBookings) {
      if (!booking.clientEmail) continue;

      try {
        await notifyReminder24h({
          bookingId: booking.id,
          clientId: booking.clientId,
          clientName: booking.clientName || 'Client',
          clientEmail: booking.clientEmail,
          tenantId: booking.tenantId,
          serviceId: booking.serviceId,
          startUtc: booking.startUtc,
        });

        // SMS reminder (if client has phone)
        if (booking.clientPhone) {
          smsReminderClient({
            clientPhone: booking.clientPhone,
            clientId: booking.clientId,
            tenantId: booking.tenantId,
            serviceId: booking.serviceId,
            bookingId: booking.id,
            startUtc: booking.startUtc,
          }).catch((err) => console.error(`[Cron/SMS] Reminder failed for ${booking.id}:`, err));
        }

        // Mark as sent
        await db
          .update(bookings)
          .set({ reminderSent24h: true })
          .where(eq(bookings.id, booking.id));

        sent++;
      } catch (err) {
        console.error(`[Cron/Reminders] Failed for booking ${booking.id}:`, err);
        failed++;
      }
    }

    console.log(`[Cron/Reminders] Processed ${upcomingBookings.length} bookings: ${sent} sent, ${failed} failed`);

    return NextResponse.json({
      processed: upcomingBookings.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error('[Cron/Reminders] Error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}