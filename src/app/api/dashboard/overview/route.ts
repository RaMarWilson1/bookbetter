// src/app/api/dashboard/overview/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import {
  staffAccounts,
  tenants,
  bookings,
  services,
  paymentIntents,
  availabilityTemplates,
} from '@/db/schema';
import { eq, and, gte, lte, count, sum, sql, desc, asc } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [staff] = await db
    .select({
      tenantId: staffAccounts.tenantId,
      role: staffAccounts.role,
    })
    .from(staffAccounts)
    .where(eq(staffAccounts.userId, session.user.id))
    .limit(1);

  if (!staff) {
    return NextResponse.json({ error: 'No business' }, { status: 404 });
  }

  const [tenant] = await db
    .select({
      id: tenants.id,
      plan: tenants.plan,
      slug: tenants.slug,
      bookingsQuota: tenants.bookingsQuota,
    })
    .from(tenants)
    .where(eq(tenants.id, staff.tenantId))
    .limit(1);

  if (!tenant) {
    return NextResponse.json({ error: 'No tenant' }, { status: 404 });
  }

  const tid = tenant.id;
  const now = new Date();

  // ─── Date helpers ──────────────────────────────────────
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // ─── Basic stats (all plans) ──────────────────────────
  // Today's bookings
  const [todayBookings] = await db
    .select({ count: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.tenantId, tid),
        gte(bookings.startUtc, todayStart),
        lte(bookings.startUtc, todayEnd)
      )
    );

  // This month's bookings (for Starter limit)
  const [monthBookings] = await db
    .select({ count: count() })
    .from(bookings)
    .where(
      and(eq(bookings.tenantId, tid), gte(bookings.createdAt, monthStart))
    );

  // Total unique clients (from bookings)
  const [totalClients] = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${bookings.clientEmail})` })
    .from(bookings)
    .where(eq(bookings.tenantId, tid));

  // Today's appointments (full details)
  const todayAppointments = await db
    .select({
      id: bookings.id,
      clientName: bookings.clientName,
      startTime: bookings.startUtc,
      endTime: bookings.endUtc,
      status: bookings.status,
      serviceName: services.name,
      priceCents: services.priceCents,
    })
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(
      and(
        eq(bookings.tenantId, tid),
        gte(bookings.startUtc, todayStart),
        lte(bookings.startUtc, todayEnd)
      )
    )
    .orderBy(asc(bookings.startUtc))
    .limit(20);

  // Completion rate (completed / total non-cancelled this month)
  const [completedCount] = await db
    .select({ count: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.tenantId, tid),
        eq(bookings.status, 'completed'),
        gte(bookings.startUtc, monthStart)
      )
    );

  const [totalNonCancelled] = await db
    .select({ count: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.tenantId, tid),
        gte(bookings.startUtc, monthStart),
        sql`${bookings.status} != 'cancelled'`
      )
    );

  const completionRate =
    totalNonCancelled.count > 0
      ? Math.round((completedCount.count / totalNonCancelled.count) * 100)
      : null;

  // Setup checklist
  const [serviceCount] = await db
    .select({ count: count() })
    .from(services)
    .where(and(eq(services.tenantId, tid), eq(services.active, true)));

  const [availabilityCount] = await db
    .select({ count: count() })
    .from(availabilityTemplates)
    .where(
      and(
        eq(availabilityTemplates.tenantId, tid),
        eq(availabilityTemplates.active, true)
      )
    );

  const [stripeCheck] = await db
    .select({
      stripeOnboardingComplete: staffAccounts.stripeOnboardingComplete,
    })
    .from(staffAccounts)
    .where(
      and(eq(staffAccounts.tenantId, tid), eq(staffAccounts.role, 'owner'))
    )
    .limit(1);

  const setupComplete = {
    hasServices: serviceCount.count > 0,
    hasAvailability: availabilityCount.count > 0,
    hasStripe: stripeCheck?.stripeOnboardingComplete ?? false,
    allDone:
      serviceCount.count > 0 &&
      availabilityCount.count > 0 &&
      (stripeCheck?.stripeOnboardingComplete ?? false),
  };

  // ─── Growth+ analytics ────────────────────────────────
  let analytics = null;

  if (tenant.plan !== 'starter') {
    // This week's revenue
    const [weekRevenue] = await db
      .select({ total: sum(paymentIntents.amountCents) })
      .from(paymentIntents)
      .innerJoin(bookings, eq(paymentIntents.bookingId, bookings.id))
      .where(
        and(
          eq(bookings.tenantId, tid),
          eq(paymentIntents.status, 'succeeded'),
          gte(paymentIntents.createdAt, weekStart),
          lte(paymentIntents.createdAt, weekEnd)
        )
      );

    // Last week's revenue (for comparison)
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const [lastWeekRevenue] = await db
      .select({ total: sum(paymentIntents.amountCents) })
      .from(paymentIntents)
      .innerJoin(bookings, eq(paymentIntents.bookingId, bookings.id))
      .where(
        and(
          eq(bookings.tenantId, tid),
          eq(paymentIntents.status, 'succeeded'),
          gte(paymentIntents.createdAt, lastWeekStart),
          lte(paymentIntents.createdAt, weekStart)
        )
      );

    // Revenue by day (last 30 days)
    const thirtyDaysAgo = new Date(todayStart);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueByDay = await db
      .select({
        day: sql<string>`TO_CHAR(${paymentIntents.createdAt}, 'YYYY-MM-DD')`,
        total: sum(paymentIntents.amountCents),
      })
      .from(paymentIntents)
      .innerJoin(bookings, eq(paymentIntents.bookingId, bookings.id))
      .where(
        and(
          eq(bookings.tenantId, tid),
          eq(paymentIntents.status, 'succeeded'),
          gte(paymentIntents.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(sql`TO_CHAR(${paymentIntents.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${paymentIntents.createdAt}, 'YYYY-MM-DD')`);

    // Top services by booking count (this month)
    const topServices = await db
      .select({
        name: services.name,
        bookingCount: count(bookings.id),
        revenue: sum(services.priceCents),
      })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(
        and(
          eq(bookings.tenantId, tid),
          gte(bookings.createdAt, monthStart),
          sql`${bookings.status} != 'cancelled'`
        )
      )
      .groupBy(services.name)
      .orderBy(desc(count(bookings.id)))
      .limit(5);

    // Client retention — repeat clients this month
    const [repeatClients] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT CASE WHEN booking_count > 1 THEN client_email END)`,
      })
      .from(
        sql`(
          SELECT ${bookings.clientEmail} as client_email, COUNT(*) as booking_count
          FROM ${bookings}
          WHERE ${bookings.tenantId} = ${tid}
            AND ${bookings.status} != 'cancelled'
          GROUP BY ${bookings.clientEmail}
        ) sub`
      );

    const [uniqueClients] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${bookings.clientEmail})`,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.tenantId, tid),
          sql`${bookings.status} != 'cancelled'`
        )
      );

    const retentionRate =
      uniqueClients.count > 0
        ? Math.round((repeatClients.count / uniqueClients.count) * 100)
        : 0;

    // Busiest days/times heatmap (last 90 days)
    const ninetyDaysAgo = new Date(todayStart);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const heatmapData = await db
      .select({
        dayOfWeek: sql<number>`EXTRACT(DOW FROM ${bookings.startUtc})::int`,
        hourOfDay: sql<number>`EXTRACT(HOUR FROM ${bookings.startUtc})::int`,
        count: count(),
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.tenantId, tid),
          gte(bookings.startUtc, ninetyDaysAgo),
          sql`${bookings.status} != 'cancelled'`
        )
      )
      .groupBy(
        sql`EXTRACT(DOW FROM ${bookings.startUtc})`,
        sql`EXTRACT(HOUR FROM ${bookings.startUtc})`
      );

    analytics = {
      weekRevenue: Number(weekRevenue?.total || 0),
      lastWeekRevenue: Number(lastWeekRevenue?.total || 0),
      revenueByDay: revenueByDay.map((r) => ({
        day: r.day,
        total: Number(r.total || 0),
      })),
      topServices: topServices.map((s) => ({
        name: s.name,
        bookingCount: s.bookingCount,
        revenue: Number(s.revenue || 0),
      })),
      retentionRate,
      repeatClients: repeatClients.count,
      uniqueClients: uniqueClients.count,
      heatmap: heatmapData.map((h) => ({
        day: h.dayOfWeek,
        hour: h.hourOfDay,
        count: h.count,
      })),
    };
  }

  return NextResponse.json({
    plan: tenant.plan,
    slug: tenant.slug,
    todayBookings: todayBookings.count,
    monthBookings: monthBookings.count,
    bookingsQuota: tenant.bookingsQuota || 15,
    totalClients: totalClients.count,
    completionRate,
    todayAppointments,
    setupComplete,
    analytics,
  });
}