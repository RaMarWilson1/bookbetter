// src/app/api/my-bookings/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { bookings, services, tenants, reviews } from '@/db/schema';
import { eq, desc, and, or, gte, lt } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    const results = await db
      .select({
        id: bookings.id,
        startUtc: bookings.startUtc,
        endUtc: bookings.endUtc,
        status: bookings.status,
        paymentStatus: bookings.paymentStatus,
        clientNotes: bookings.clientNotes,
        cancelledAt: bookings.cancelledAt,
        cancellationReason: bookings.cancellationReason,
        createdAt: bookings.createdAt,
        // Service details
        serviceName: services.name,
        serviceDescription: services.description,
        servicePriceCents: services.priceCents,
        serviceDurationMinutes: services.durationMinutes,
        // Business details
        tenantId: tenants.id,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
        tenantPhone: tenants.phone,
        tenantEmail: tenants.email,
        tenantAddress: tenants.address,
        tenantCity: tenants.city,
        tenantState: tenants.state,
        tenantLogo: tenants.logo,
        tenantPrimaryColor: tenants.primaryColor,
        // Review
        reviewId: reviews.id,
        reviewRating: reviews.rating,
        reviewComment: reviews.comment,
      })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .innerJoin(tenants, eq(bookings.tenantId, tenants.id))
      .leftJoin(reviews, and(
        eq(reviews.bookingId, bookings.id),
        eq(reviews.clientId, session.user.id)
      ))
      .where(eq(bookings.clientId, session.user.id))
      .orderBy(desc(bookings.startUtc));

    // Split into upcoming, past, cancelled
    const upcoming = results.filter(
      (b) => b.status !== 'cancelled' && new Date(b.startUtc) >= now
    );
    const past = results.filter(
      (b) => b.status !== 'cancelled' && new Date(b.startUtc) < now
    );
    const cancelled = results.filter((b) => b.status === 'cancelled');

    return NextResponse.json({
      upcoming,
      past,
      cancelled,
      total: results.length,
    });
  } catch (error) {
    console.error('[My Bookings] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}