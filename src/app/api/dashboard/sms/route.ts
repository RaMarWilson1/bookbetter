// src/app/api/dashboard/sms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { tenants, staffAccounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSmsUsage } from '@/lib/sms';

// GET — Fetch SMS usage for the current pro's tenant
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [staff] = await db
      .select({ tenantId: staffAccounts.tenantId })
      .from(staffAccounts)
      .where(
        and(
          eq(staffAccounts.userId, session.user.id),
          eq(staffAccounts.role, 'owner')
        )
      )
      .limit(1);

    if (!staff) return NextResponse.json({ error: 'No tenant found' }, { status: 404 });

    const usage = await getSmsUsage(staff.tenantId);
    return NextResponse.json(usage);
  } catch (error) {
    console.error('[SMS API] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch SMS usage' }, { status: 500 });
  }
}

// PUT — Update SMS settings (overage toggle)
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const [staff] = await db
      .select({ tenantId: staffAccounts.tenantId })
      .from(staffAccounts)
      .where(
        and(
          eq(staffAccounts.userId, session.user.id),
          eq(staffAccounts.role, 'owner')
        )
      )
      .limit(1);

    if (!staff) return NextResponse.json({ error: 'No tenant found' }, { status: 404 });

    // Toggle overage
    if (body.smsOverageEnabled !== undefined) {
      await db
        .update(tenants)
        .set({ smsOverageEnabled: body.smsOverageEnabled })
        .where(eq(tenants.id, staff.tenantId));
    }

    const usage = await getSmsUsage(staff.tenantId);
    return NextResponse.json(usage);
  } catch (error) {
    console.error('[SMS API] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update SMS settings' }, { status: 500 });
  }
}