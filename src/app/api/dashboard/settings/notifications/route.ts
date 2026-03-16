// src/app/api/dashboard/settings/notifications/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { tenants, staffAccounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const PREF_COLUMNS = [
  'notifyEmailBooking',
  'notifyEmailCancellation',
  'notifyEmailReschedule',
  'notifyEmailReminder',
  'notifyEmailReviewRequest',
  'notifySmsBooking',
  'notifySmsCancellation',
  'notifySmsReschedule',
  'notifySmsReminder',
  'notifyInAppBooking',
  'notifyInAppCancellation',
  'notifyInAppReschedule',
  'notifyInAppReview',
  'notifyInAppPayment',
] as const;

type PrefKey = typeof PREF_COLUMNS[number];

async function getTenantId(userId: string): Promise<string | null> {
  const [staff] = await db
    .select({ tenantId: staffAccounts.tenantId })
    .from(staffAccounts)
    .where(and(eq(staffAccounts.userId, userId), eq(staffAccounts.role, 'owner')))
    .limit(1);
  return staff?.tenantId || null;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantId(session.user.id);
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 404 });
    }

    const [tenant] = await db
      .select({
        notifyEmailBooking: tenants.notifyEmailBooking,
        notifyEmailCancellation: tenants.notifyEmailCancellation,
        notifyEmailReschedule: tenants.notifyEmailReschedule,
        notifyEmailReminder: tenants.notifyEmailReminder,
        notifyEmailReviewRequest: tenants.notifyEmailReviewRequest,
        notifySmsBooking: tenants.notifySmsBooking,
        notifySmsCancellation: tenants.notifySmsCancellation,
        notifySmsReschedule: tenants.notifySmsReschedule,
        notifySmsReminder: tenants.notifySmsReminder,
        notifyInAppBooking: tenants.notifyInAppBooking,
        notifyInAppCancellation: tenants.notifyInAppCancellation,
        notifyInAppReschedule: tenants.notifyInAppReschedule,
        notifyInAppReview: tenants.notifyInAppReview,
        notifyInAppPayment: tenants.notifyInAppPayment,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('[NotifPrefs] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantId(session.user.id);
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 404 });
    }

    const body = await request.json();

    // Only allow known boolean preference keys
    const updates: Partial<Record<PrefKey, boolean>> = {};
    for (const key of PREF_COLUMNS) {
      if (typeof body[key] === 'boolean') {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid preferences provided' }, { status: 400 });
    }

    await db
      .update(tenants)
      .set(updates)
      .where(eq(tenants.id, tenantId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[NotifPrefs] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}