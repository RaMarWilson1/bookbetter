// src/app/api/dashboard/settings/cancellation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { tenants, staffAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [staff] = await db
      .select({ tenantId: staffAccounts.tenantId })
      .from(staffAccounts)
      .where(eq(staffAccounts.userId, session.user.id))
      .limit(1);

    if (!staff) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const body = await req.json();
    const { cancellationWindowHours, lateCancellationFeeCents, cancellationPolicyText } = body;

    await db
      .update(tenants)
      .set({
        cancellationWindowHours: cancellationWindowHours ?? 24,
        lateCancellationFeeCents: lateCancellationFeeCents ?? 0,
        cancellationPolicyText: cancellationPolicyText || null,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, staff.tenantId));

    return NextResponse.json({ message: 'Cancellation policy updated' });
  } catch (error) {
    console.error('[Cancellation Settings] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}