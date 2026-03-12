// src/app/api/book/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings, services, tenants, users, availabilityExceptions } from '@/db/schema';
import { eq, and, gte, lte, or, count } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenantId,
      serviceId,
      startUtc,
      endUtc,
      clientName,
      clientEmail,
      clientPhone,
      clientNotes,
    } = body;

    // Validate required fields
    if (!tenantId || !serviceId || !startUtc || !endUtc || !clientName || !clientEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify service exists and belongs to tenant
    const [service] = await db
      .select()
      .from(services)
      .where(and(eq(services.id, serviceId), eq(services.tenantId, tenantId), eq(services.active, true)))
      .limit(1);

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Verify tenant is active
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(and(eq(tenants.id, tenantId), eq(tenants.active, true)))
      .limit(1);

    if (!tenant) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Check booking limit for Starter plan
    if (tenant.plan === 'starter') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [monthCount] = await db
        .select({ count: count() })
        .from(bookings)
        .where(
          and(
            eq(bookings.tenantId, tenantId),
            gte(bookings.createdAt, startOfMonth)
          )
        );

      const limit = tenant.bookingsQuota || 15;
      if ((monthCount?.count || 0) >= limit) {
        return NextResponse.json(
          {
            error: 'This professional has reached their booking limit for the month. Please try again next month or contact them directly.',
            code: 'BOOKING_LIMIT_REACHED',
          },
          { status: 429 }
        );
      }
    }

    const startDate = new Date(startUtc);
    const endDate = new Date(endUtc);

    // Check the date isn't in the past
    if (startDate < new Date()) {
      return NextResponse.json(
        { error: 'Cannot book a time in the past' },
        { status: 400 }
      );
    }

    // Check for availability exceptions (time off)
    const dateStart = new Date(startDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(startDate);
    dateEnd.setHours(23, 59, 59, 999);

    const exceptions = await db
      .select()
      .from(availabilityExceptions)
      .where(
        and(
          eq(availabilityExceptions.tenantId, tenantId),
          lte(availabilityExceptions.startUtc, dateEnd),
          gte(availabilityExceptions.endUtc, dateStart)
        )
      );

    if (exceptions.length > 0) {
      return NextResponse.json(
        { error: 'This date is not available' },
        { status: 400 }
      );
    }

    // Check for overlapping bookings
    const overlapping = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.tenantId, tenantId),
          or(
            eq(bookings.status, 'pending'),
            eq(bookings.status, 'confirmed')
          ),
          lte(bookings.startUtc, endDate),
          gte(bookings.endUtc, startDate)
        )
      )
      .limit(1);

    if (overlapping.length > 0) {
      return NextResponse.json(
        { error: 'This time slot is no longer available. Please choose another time.' },
        { status: 409 }
      );
    }

    // Find or determine clientId
    // If the user is logged in, use their ID. Otherwise use a guest placeholder.
    const session = await auth();
    let clientId = session?.user?.id;

    if (!clientId) {
      // Check if a user with this email exists
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, clientEmail.toLowerCase()))
        .limit(1);

      if (existingUser) {
        clientId = existingUser.id;
      } else {
        // Create a guest user
        const [guestUser] = await db
          .insert(users)
          .values({
            name: clientName,
            email: clientEmail.toLowerCase(),
            role: 'client',
          })
          .returning({ id: users.id });

        clientId = guestUser.id;
      }
    }

    // Create the booking
    const [booking] = await db
      .insert(bookings)
      .values({
        clientId,
        tenantId,
        serviceId,
        startUtc: startDate,
        endUtc: endDate,
        status: 'pending',
        paymentStatus: 'unpaid',
        clientName,
        clientEmail: clientEmail.toLowerCase(),
        clientPhone: clientPhone || null,
        clientNotes: clientNotes || null,
      })
      .returning();

    return NextResponse.json(
      { booking, message: 'Booking created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Book] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}