// src/app/api/my-bookings/[id]/review/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { bookings, reviews, staffAccounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notifyInAppReviewReceived } from '@/lib/in-app-notify';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: bookingId } = await params;

  try {
    const body = await req.json();
    const { rating, comment } = body as { rating: number; comment?: string };

    // Validate rating
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
    }

    // Get booking — must belong to this user
    const [booking] = await db
      .select({
        id: bookings.id,
        clientId: bookings.clientId,
        tenantId: bookings.tenantId,
        status: bookings.status,
        startUtc: bookings.startUtc,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.id, bookingId),
          eq(bookings.clientId, session.user.id)
        )
      )
      .limit(1);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Must be a past booking
    if (new Date(booking.startUtc) > new Date()) {
      return NextResponse.json(
        { error: 'You can only review past appointments' },
        { status: 400 }
      );
    }

    // Can't review cancelled bookings
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot review a cancelled booking' },
        { status: 400 }
      );
    }

    // Check if already reviewed
    const [existing] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.bookingId, bookingId))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: 'You already reviewed this booking' },
        { status: 409 }
      );
    }

    // Create review
    const [review] = await db
      .insert(reviews)
      .values({
        bookingId: booking.id,
        tenantId: booking.tenantId,
        clientId: session.user.id,
        rating,
        comment: comment?.trim() || null,
      })
      .returning();

    // In-app notification for pro
    const [owner] = await db
      .select({ userId: staffAccounts.userId })
      .from(staffAccounts)
      .where(and(eq(staffAccounts.tenantId, booking.tenantId), eq(staffAccounts.role, 'owner')))
      .limit(1);
    if (owner) {
      notifyInAppReviewReceived(owner.userId, session.user.name || 'A client', rating)
        .catch((err) => console.error('[InApp] Review received error:', err));
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('[Review] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}