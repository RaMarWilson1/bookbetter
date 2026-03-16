// src/app/api/dashboard/appointments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notifyRescheduleProposal, notifyCancellation } from '@/lib/notifications';
import { notifyInAppRescheduleProposal, notifyInAppCancellation } from '@/lib/in-app-notify';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    // ─── Reschedule proposal ───────────────────────
    if (body.action === 'propose_reschedule') {
      const { proposedStartUtc, proposedEndUtc, rescheduleNote } = body;

      if (!proposedStartUtc || !proposedEndUtc) {
        return NextResponse.json({ error: 'Proposed start and end times are required' }, { status: 400 });
      }

      const proposedStart = new Date(proposedStartUtc);
      const proposedEnd = new Date(proposedEndUtc);

      if (proposedStart < new Date()) {
        return NextResponse.json({ error: 'Proposed time cannot be in the past' }, { status: 400 });
      }
      if (proposedEnd <= proposedStart) {
        return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
      }

      updateData.proposedStartUtc = proposedStart;
      updateData.proposedEndUtc = proposedEnd;
      updateData.proposedAt = new Date();
      updateData.proposedByUserId = session.user.id;
      updateData.rescheduleNote = rescheduleNote || null;

      const [updated] = await db
        .update(bookings)
        .set(updateData)
        .where(eq(bookings.id, id))
        .returning();

      // Notify client about reschedule proposal
      if (updated.clientEmail) {
        notifyRescheduleProposal({
          bookingId: updated.id,
          clientId: updated.clientId,
          clientName: updated.clientName || 'Client',
          clientEmail: updated.clientEmail,
          tenantId: updated.tenantId,
          serviceId: updated.serviceId,
          startUtc: updated.startUtc,
          proposedStartUtc: proposedStart,
          rescheduleNote: rescheduleNote || undefined,
        }).catch((err) => console.error('[Notifications] Reschedule proposal error:', err));

        // In-app notification for client
        notifyInAppRescheduleProposal(updated.clientId, 'Your provider', 'appointment')
          .catch((err) => console.error('[InApp] Reschedule proposal error:', err));
      }

      return NextResponse.json({ booking: updated });
    }

    // ─── Clear reschedule proposal (pro cancels their own proposal) ───
    if (body.action === 'cancel_reschedule') {
      updateData.proposedStartUtc = null;
      updateData.proposedEndUtc = null;
      updateData.proposedAt = null;
      updateData.proposedByUserId = null;
      updateData.rescheduleNote = null;

      const [updated] = await db
        .update(bookings)
        .set(updateData)
        .where(eq(bookings.id, id))
        .returning();

      return NextResponse.json({ booking: updated });
    }

    // ─── Standard status update ──────────────────────
    if (body.status) {
      updateData.status = body.status;
      if (body.status === 'cancelled') {
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = body.reason || null;
      }
    }
    if (body.internalNotes !== undefined) updateData.internalNotes = body.internalNotes;

    const [updated] = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, id))
      .returning();

    // Notify client when pro cancels
    if (body.status === 'cancelled' && updated.clientEmail) {
      notifyCancellation(
        {
          bookingId: updated.id,
          clientId: updated.clientId,
          clientName: updated.clientName || 'Client',
          clientEmail: updated.clientEmail,
          tenantId: updated.tenantId,
          serviceId: updated.serviceId,
          startUtc: updated.startUtc,
          reason: body.reason || undefined,
        },
        'pro'
      ).catch((err) => console.error('[Notifications] Pro cancellation error:', err));

      // In-app notification for client
      notifyInAppCancellation(updated.clientId, 'Your provider', 'your appointment', false)
        .catch((err) => console.error('[InApp] Pro cancellation error:', err));
    }

    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error('[Appointments] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}