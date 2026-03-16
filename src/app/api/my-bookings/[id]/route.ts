// src/app/api/my-bookings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { bookings, staffAccounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notifyRescheduleAccepted, notifyRescheduleDeclined } from '@/lib/notifications';
import { notifyInAppRescheduleResponse } from '@/lib/in-app-notify';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();

    // Get the booking and verify client owns it
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.clientId !== session.user.id) {
      return NextResponse.json({ error: 'Not your booking' }, { status: 403 });
    }

    // ─── Accept reschedule proposal ───────────────────
    if (body.action === 'accept_reschedule') {
      if (!booking.proposedStartUtc || !booking.proposedEndUtc) {
        return NextResponse.json({ error: 'No reschedule proposal to accept' }, { status: 400 });
      }

      const [updated] = await db
        .update(bookings)
        .set({
          // Move the booking to the proposed time
          startUtc: booking.proposedStartUtc,
          endUtc: booking.proposedEndUtc,
          // Clear the proposal
          proposedStartUtc: null,
          proposedEndUtc: null,
          proposedAt: null,
          proposedByUserId: null,
          rescheduleNote: null,
          // Confirm the booking
          status: 'confirmed',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, id))
        .returning();

      // Notify pro that client accepted the new time
      if (updated.clientEmail) {
        notifyRescheduleAccepted({
          bookingId: updated.id,
          clientId: updated.clientId,
          clientName: updated.clientName || 'Client',
          clientEmail: updated.clientEmail,
          tenantId: updated.tenantId,
          serviceId: updated.serviceId,
          startUtc: booking.startUtc, // original time
          newStartUtc: updated.startUtc, // new time
        }).catch((err) => console.error('[Notifications] Reschedule accepted error:', err));

        // In-app notification for pro
        const [owner] = await db
          .select({ userId: staffAccounts.userId })
          .from(staffAccounts)
          .where(and(eq(staffAccounts.tenantId, updated.tenantId), eq(staffAccounts.role, 'owner')))
          .limit(1);
        if (owner) {
          notifyInAppRescheduleResponse(owner.userId, updated.clientName || 'Client', true)
            .catch((err) => console.error('[InApp] Reschedule accepted error:', err));
        }
      }
      return NextResponse.json({ booking: updated });
    }

    // ─── Decline reschedule proposal ───────────────────
    if (body.action === 'decline_reschedule') {
      const [updated] = await db
        .update(bookings)
        .set({
          // Clear the proposal, keep original time
          proposedStartUtc: null,
          proposedEndUtc: null,
          proposedAt: null,
          proposedByUserId: null,
          rescheduleNote: null,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, id))
        .returning();

      // Notify pro that client declined the reschedule
      if (updated.clientEmail) {
        notifyRescheduleDeclined({
          bookingId: updated.id,
          clientId: updated.clientId,
          clientName: updated.clientName || 'Client',
          clientEmail: updated.clientEmail,
          tenantId: updated.tenantId,
          serviceId: updated.serviceId,
          startUtc: updated.startUtc,
        }).catch((err) => console.error('[Notifications] Reschedule declined error:', err));

        // In-app notification for pro
        const [owner] = await db
          .select({ userId: staffAccounts.userId })
          .from(staffAccounts)
          .where(and(eq(staffAccounts.tenantId, updated.tenantId), eq(staffAccounts.role, 'owner')))
          .limit(1);
        if (owner) {
          notifyInAppRescheduleResponse(owner.userId, updated.clientName || 'Client', false)
            .catch((err) => console.error('[InApp] Reschedule declined error:', err));
        }
      }
      return NextResponse.json({ booking: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[My Bookings] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}