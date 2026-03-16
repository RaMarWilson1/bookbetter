// src/app/api/dashboard/revenue/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import {
  staffAccounts,
  bookings,
  services,
  payments,
  users,
} from '@/db/schema';
import { eq, and, gte, count, sum } from 'drizzle-orm';

export async function GET(_req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get staff account — must be owner or manager to see all revenue
    const [staff] = await db
      .select({
        tenantId: staffAccounts.tenantId,
        role: staffAccounts.role,
      })
      .from(staffAccounts)
      .where(eq(staffAccounts.userId, session.user.id))
      .limit(1);

    if (!staff) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (staff.role === 'staff') {
      return NextResponse.json(
        { error: 'Only owners and managers can view revenue' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(_req.url);
    const period = searchParams.get('period') || 'month';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Total revenue from payments table (all sources)
    const [totalRevenue] = await db
      .select({
        total: sum(payments.amountCents),
        count: count(payments.id),
      })
      .from(payments)
      .where(
        and(
          eq(payments.tenantId, staff.tenantId),
          gte(payments.paidAt, startDate)
        )
      );

    // Revenue by method
    const methodBreakdown = await db
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

    // Per-staff breakdown (from completed bookings — keeps existing behavior)
    const staffRevenue = await db
      .select({
        staffId: bookings.staffId,
        staffName: users.name,
        total: sum(services.priceCents),
        bookingCount: count(bookings.id),
        stripeConnected: staffAccounts.stripeOnboardingComplete,
      })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(users, eq(bookings.staffId, users.id))
      .leftJoin(
        staffAccounts,
        and(
          eq(staffAccounts.userId, bookings.staffId),
          eq(staffAccounts.tenantId, staff.tenantId)
        )
      )
      .where(
        and(
          eq(bookings.tenantId, staff.tenantId),
          gte(bookings.createdAt, startDate),
          eq(bookings.status, 'completed')
        )
      )
      .groupBy(bookings.staffId, users.name, staffAccounts.stripeOnboardingComplete);

    // Get all staff Stripe statuses
    const allStaff = await db
      .select({
        userId: staffAccounts.userId,
        userName: users.name,
        role: staffAccounts.role,
        stripeAccountId: staffAccounts.stripeAccountId,
        stripeOnboardingComplete: staffAccounts.stripeOnboardingComplete,
      })
      .from(staffAccounts)
      .innerJoin(users, eq(staffAccounts.userId, users.id))
      .where(and(eq(staffAccounts.tenantId, staff.tenantId), eq(staffAccounts.active, true)));

    return NextResponse.json({
      period,
      totalRevenueCents: totalRevenue?.total ? Number(totalRevenue.total) : 0,
      totalPayments: totalRevenue?.count || 0,
      byMethod: methodBreakdown.map((m) => ({
        method: m.method,
        totalCents: Number(m.total || 0),
        count: m.count,
      })),
      staffBreakdown: staffRevenue.map((s) => ({
        staffId: s.staffId,
        name: s.staffName || 'Unknown',
        revenueCents: s.total ? Number(s.total) : 0,
        bookings: s.bookingCount || 0,
        stripeConnected: s.stripeConnected || false,
      })),
      team: allStaff.map((s) => ({
        userId: s.userId,
        name: s.userName,
        role: s.role,
        stripeConnected: !!s.stripeAccountId,
        stripeReady: s.stripeOnboardingComplete || false,
      })),
    });
  } catch (error) {
    console.error('Revenue API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
}