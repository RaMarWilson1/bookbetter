// src/app/api/dashboard/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { payments, staffAccounts, bookings, services } from '@/db/schema';
import { eq, and, gte, lte, desc, sum, count, sql } from 'drizzle-orm';

const VALID_METHODS = ['stripe', 'cash', 'venmo', 'zelle', 'cashapp', 'other'];

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [staff] = await db
      .select({ tenantId: staffAccounts.tenantId, role: staffAccounts.role })
      .from(staffAccounts)
      .where(eq(staffAccounts.userId, session.user.id))
      .limit(1);

    if (!staff) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month';
    const method = searchParams.get('method'); // optional filter

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      // month (default)
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Build conditions
    const conditions = [
      eq(payments.tenantId, staff.tenantId),
      gte(payments.paidAt, startDate),
    ];
    if (method && VALID_METHODS.includes(method)) {
      conditions.push(eq(payments.method, method));
    }

    // Fetch payments list
    const paymentsList = await db
      .select({
        id: payments.id,
        amountCents: payments.amountCents,
        method: payments.method,
        note: payments.note,
        paidAt: payments.paidAt,
        bookingId: payments.bookingId,
        clientName: bookings.clientName,
        serviceName: services.name,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .leftJoin(bookings, eq(payments.bookingId, bookings.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .where(and(...conditions))
      .orderBy(desc(payments.paidAt))
      .limit(100);

    // Totals by method
    const methodTotals = await db
      .select({
        method: payments.method,
        total: sum(payments.amountCents),
        count: count(),
      })
      .from(payments)
      .where(
        and(
          eq(payments.tenantId, staff.tenantId),
          gte(payments.paidAt, startDate)
        )
      )
      .groupBy(payments.method);

    // Grand total
    const grandTotal = methodTotals.reduce(
      (acc, m) => acc + Number(m.total || 0),
      0
    );

    // Revenue by day for chart
    const revenueByDay = await db
      .select({
        day: sql<string>`TO_CHAR(${payments.paidAt}, 'YYYY-MM-DD')`,
        total: sum(payments.amountCents),
      })
      .from(payments)
      .where(
        and(
          eq(payments.tenantId, staff.tenantId),
          gte(payments.paidAt, startDate)
        )
      )
      .groupBy(sql`TO_CHAR(${payments.paidAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${payments.paidAt}, 'YYYY-MM-DD')`);

    return NextResponse.json({
      payments: paymentsList.map((p) => ({
        ...p,
        amountCents: Number(p.amountCents),
      })),
      summary: {
        grandTotalCents: grandTotal,
        byMethod: methodTotals.map((m) => ({
          method: m.method,
          totalCents: Number(m.total || 0),
          count: m.count,
        })),
        revenueByDay: revenueByDay.map((r) => ({
          day: r.day,
          totalCents: Number(r.total || 0),
        })),
      },
      period,
    });
  } catch (error) {
    console.error('[Payments] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST — Log a manual payment
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [staff] = await db
      .select({ tenantId: staffAccounts.tenantId, role: staffAccounts.role })
      .from(staffAccounts)
      .where(eq(staffAccounts.userId, session.user.id))
      .limit(1);

    if (!staff) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await req.json();
    const { amountCents, method, note, paidAt, bookingId } = body;

    if (!amountCents || amountCents <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }
    if (!method || !VALID_METHODS.includes(method)) {
      return NextResponse.json(
        { error: `Invalid method. Must be one of: ${VALID_METHODS.join(', ')}` },
        { status: 400 }
      );
    }

    // If bookingId provided, verify it belongs to this tenant
    if (bookingId) {
      const [booking] = await db
        .select({ id: bookings.id })
        .from(bookings)
        .where(and(eq(bookings.id, bookingId), eq(bookings.tenantId, staff.tenantId)))
        .limit(1);
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
    }

    const [payment] = await db
      .insert(payments)
      .values({
        tenantId: staff.tenantId,
        bookingId: bookingId || null,
        amountCents: Math.round(amountCents),
        method,
        note: note || null,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        createdByUserId: session.user.id,
      })
      .returning();

    // If linked to a booking, update its payment status
    if (bookingId) {
      await db
        .update(bookings)
        .set({ paymentStatus: 'paid', updatedAt: new Date() })
        .where(eq(bookings.id, bookingId));
    }

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error('[Payments] POST error:', error);
    return NextResponse.json({ error: 'Failed to log payment' }, { status: 500 });
  }
}