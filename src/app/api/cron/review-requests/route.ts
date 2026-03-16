// src/app/api/cron/review-requests/route.ts
// Vercel Cron: runs every hour to send review requests ~2h after appointment ends
// Add to vercel.json: { "crons": [{ "path": "/api/cron/review-requests", "schedule": "0 * * * *" }] }

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings, reviews } from '@/db/schema';
import { eq, and, or, gte, lte, isNull } from 'drizzle-orm';
import { notifyReviewRequest } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    // Find bookings that ended between 1 and 3 hours ago
    // (targeting ~2h post-appointment, with a window for cron timing)
    const windowStart = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() - 1 * 60 * 60 * 1000);

    const completedBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          or(
            eq(bookings.status, 'confirmed'),
            eq(bookings.status, 'completed')
          ),
          gte(bookings.endUtc, windowStart),
          lte(bookings.endUtc, windowEnd),
          eq(bookings.reviewRequestSent, false)
        )
      );

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const booking of completedBookings) {
      if (!booking.clientEmail) {
        skipped++;
        continue;
      }

      // Check if they already left a review for this booking
      const [existingReview] = await db
        .select({ id: reviews.id })
        .from(reviews)
        .where(eq(reviews.bookingId, booking.id))
        .limit(1);

      if (existingReview) {
        // Already reviewed, just mark as sent so we don't check again
        await db
          .update(bookings)
          .set({ reviewRequestSent: true })
          .where(eq(bookings.id, booking.id));
        skipped++;
        continue;
      }

      try {
        await notifyReviewRequest({
          bookingId: booking.id,
          clientId: booking.clientId,
          clientName: booking.clientName || 'Client',
          clientEmail: booking.clientEmail,
          tenantId: booking.tenantId,
          serviceId: booking.serviceId,
          startUtc: booking.startUtc,
        });

        // Mark as sent
        await db
          .update(bookings)
          .set({ reviewRequestSent: true })
          .where(eq(bookings.id, booking.id));

        sent++;
      } catch (err) {
        console.error(`[Cron/ReviewRequests] Failed for booking ${booking.id}:`, err);
        failed++;
      }
    }

    console.log(`[Cron/ReviewRequests] Processed ${completedBookings.length}: ${sent} sent, ${skipped} skipped, ${failed} failed`);

    return NextResponse.json({
      processed: completedBookings.length,
      sent,
      skipped,
      failed,
    });
  } catch (error) {
    console.error('[Cron/ReviewRequests] Error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}