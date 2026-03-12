// src/app/api/book/[id]/calendar/route.ts
//
// GET /api/book/:id/calendar — returns a .ics file download for a booking

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings, services, tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateICS } from '@/lib/calendar';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Fetch booking with service and tenant info
    const [booking] = await db
      .select({
        id: bookings.id,
        startUtc: bookings.startUtc,
        endUtc: bookings.endUtc,
        clientName: bookings.clientName,
        status: bookings.status,
        serviceName: services.name,
        serviceDuration: services.durationMinutes,
        tenantName: tenants.name,
        tenantEmail: tenants.email,
        tenantPhone: tenants.phone,
        tenantAddress: tenants.address,
        tenantCity: tenants.city,
        tenantState: tenants.state,
        tenantPostalCode: tenants.postalCode,
      })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .innerJoin(tenants, eq(bookings.tenantId, tenants.id))
      .where(eq(bookings.id, id))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'This booking was cancelled' }, { status: 400 });
    }

    // Build location string
    const locationParts = [
      booking.tenantName,
      booking.tenantAddress,
      [booking.tenantCity, booking.tenantState].filter(Boolean).join(', '),
      booking.tenantPostalCode,
    ].filter(Boolean);
    const location = locationParts.join(', ');

    // Build description
    const descriptionLines = [
      `Service: ${booking.serviceName}`,
      `Duration: ${booking.serviceDuration} minutes`,
      `With: ${booking.tenantName}`,
    ];
    if (booking.tenantPhone) {
      descriptionLines.push(`Phone: ${booking.tenantPhone}`);
    }
    if (booking.tenantEmail) {
      descriptionLines.push(`Email: ${booking.tenantEmail}`);
    }
    const description = descriptionLines.join('\n');

    const icsContent = generateICS({
      title: `${booking.serviceName} — ${booking.tenantName}`,
      description,
      location,
      startUtc: booking.startUtc,
      endUtc: booking.endUtc,
      organizerName: booking.tenantName,
      organizerEmail: booking.tenantEmail || undefined,
    });

    // Return as downloadable .ics file
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="booking-${booking.id.slice(0, 8)}.ics"`,
      },
    });
  } catch (error) {
    console.error('[Calendar ICS] Error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}