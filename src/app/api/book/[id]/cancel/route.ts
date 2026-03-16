// src/app/api/book/[id]/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings, tenants, staffAccounts } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { notifyCancellation } from '@/lib/notifications';
import { notifyInAppCancellation } from '@/lib/in-app-notify';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { email } = body; // Client verifies via email

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required to cancel' },
        { status: 400 }
      );
    }

    // Find the booking
    const [booking] = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.id, id),
          eq(bookings.clientEmail, email.toLowerCase()),
          or(
            eq(bookings.status, 'pending'),
            eq(bookings.status, 'confirmed')
          )
        )
      )
      .limit(1);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found. Check your email and booking ID.' },
        { status: 404 }
      );
    }

    // Get tenant cancellation policy
    const [tenant] = await db
      .select({
        cancellationWindowHours: tenants.cancellationWindowHours,
        lateCancellationFeeCents: tenants.lateCancellationFeeCents,
        cancellationPolicyText: tenants.cancellationPolicyText,
        name: tenants.name,
      })
      .from(tenants)
      .where(eq(tenants.id, booking.tenantId))
      .limit(1);

    const windowHours = tenant?.cancellationWindowHours ?? 24;
    const feeCents = tenant?.lateCancellationFeeCents ?? 0;

    // Calculate if this is a late cancellation
    const now = new Date();
    const appointmentTime = new Date(booking.startUtc);
    const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isLateCancellation = hoursUntilAppointment < windowHours;
    const cancellationFeeCents = isLateCancellation ? feeCents : 0;

    // Don't allow cancellation of past bookings
    if (appointmentTime < now) {
      return NextResponse.json(
        { error: 'Cannot cancel a past appointment' },
        { status: 400 }
      );
    }

    // Update the booking
    await db
      .update(bookings)
      .set({
        status: 'cancelled',
        cancelledAt: now,
        cancellationReason: isLateCancellation
          ? `Late cancellation by client (${hoursUntilAppointment.toFixed(1)} hours before appointment)`
          : 'Cancelled by client',
        updatedAt: now,
      })
      .where(eq(bookings.id, id));

    // Send cancellation emails (fire-and-forget)
    notifyCancellation(
      {
        bookingId: booking.id,
        clientId: booking.clientId,
        clientName: booking.clientName || 'Client',
        clientEmail: booking.clientEmail || email.toLowerCase(),
        tenantId: booking.tenantId,
        serviceId: booking.serviceId,
        startUtc: booking.startUtc,
        reason: isLateCancellation
          ? `Late cancellation (${hoursUntilAppointment.toFixed(1)}h before)`
          : undefined,
      },
      'client'
    ).catch((err) => console.error('[Notifications] Cancellation error:', err));

    // In-app notification for pro (client cancelled)
    const [owner] = await db
      .select({ userId: staffAccounts.userId })
      .from(staffAccounts)
      .where(and(eq(staffAccounts.tenantId, booking.tenantId), eq(staffAccounts.role, 'owner')))
      .limit(1);
    if (owner) {
      notifyInAppCancellation(owner.userId, booking.clientName || 'Client', 'an appointment', true)
        .catch((err) => console.error('[InApp] Cancellation error:', err));
    }

    return NextResponse.json({
      message: 'Booking cancelled',
      cancellationFee: cancellationFeeCents,
      isLateCancellation,
      hoursUntilAppointment: Math.max(0, hoursUntilAppointment),
    });
  } catch (error) {
    console.error('[Cancel Booking] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

// GET - Check cancellation details before confirming
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const email = req.nextUrl.searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }

  try {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.id, id),
          eq(bookings.clientEmail, email.toLowerCase()),
          or(
            eq(bookings.status, 'pending'),
            eq(bookings.status, 'confirmed')
          )
        )
      )
      .limit(1);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const [tenant] = await db
      .select({
        cancellationWindowHours: tenants.cancellationWindowHours,
        lateCancellationFeeCents: tenants.lateCancellationFeeCents,
        cancellationPolicyText: tenants.cancellationPolicyText,
        name: tenants.name,
      })
      .from(tenants)
      .where(eq(tenants.id, booking.tenantId))
      .limit(1);

    const windowHours = tenant?.cancellationWindowHours ?? 24;
    const feeCents = tenant?.lateCancellationFeeCents ?? 0;

    const now = new Date();
    const appointmentTime = new Date(booking.startUtc);
    const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isLateCancellation = hoursUntilAppointment < windowHours;
    const cancellationFeeCents = isLateCancellation ? feeCents : 0;

    return NextResponse.json({
      booking: {
        id: booking.id,
        startUtc: booking.startUtc,
        endUtc: booking.endUtc,
        clientName: booking.clientName,
        status: booking.status,
      },
      businessName: tenant?.name,
      policy: {
        windowHours,
        feeCents,
        policyText: tenant?.cancellationPolicyText,
      },
      cancellationFee: cancellationFeeCents,
      isLateCancellation,
      hoursUntilAppointment: Math.max(0, hoursUntilAppointment),
    });
  } catch (error) {
    console.error('[Cancel Check] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}