// src/app/api/dashboard/payments/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { payments, staffAccounts, bookings, services } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [staff] = await db
    .select({ tenantId: staffAccounts.tenantId })
    .from(staffAccounts)
    .where(eq(staffAccounts.userId, session.user.id))
    .limit(1);

  if (!staff) {
    return NextResponse.json({ error: 'No business found' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  // Default: current calendar year
  const now = new Date();
  const startDate = from ? new Date(from) : new Date(now.getFullYear(), 0, 1);
  const endDate = to ? new Date(to + 'T23:59:59') : now;

  const rows = await db
    .select({
      id: payments.id,
      amountCents: payments.amountCents,
      method: payments.method,
      note: payments.note,
      paidAt: payments.paidAt,
      bookingId: payments.bookingId,
      clientName: bookings.clientName,
      clientEmail: bookings.clientEmail,
      serviceName: services.name,
    })
    .from(payments)
    .leftJoin(bookings, eq(payments.bookingId, bookings.id))
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(
      and(
        eq(payments.tenantId, staff.tenantId),
        gte(payments.paidAt, startDate),
        lte(payments.paidAt, endDate)
      )
    )
    .orderBy(desc(payments.paidAt));

  // Build CSV
  const header = 'Date,Amount,Method,Client,Service,Note,Payment ID';
  const csvRows = rows.map((r) => {
    const date = new Date(r.paidAt).toLocaleDateString('en-US');
    const amount = (r.amountCents / 100).toFixed(2);
    const method = r.method;
    const client = csvEscape(r.clientName || '');
    const service = csvEscape(r.serviceName || '');
    const note = csvEscape(r.note || '');
    const id = r.id;
    return `${date},${amount},${method},${client},${service},${note},${id}`;
  });

  const csv = [header, ...csvRows].join('\n');

  // Calculate totals summary row
  const total = rows.reduce((sum, r) => sum + r.amountCents, 0);
  const summaryRow = `\nTotal,${(total / 100).toFixed(2)},,,,${rows.length} payments,`;
  const csvWithSummary = csv + summaryRow;

  const fromStr = startDate.toISOString().split('T')[0];
  const toStr = endDate.toISOString().split('T')[0];
  const filename = `bookbetter-payments-${fromStr}-to-${toStr}.csv`;

  return new Response(csvWithSummary, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}