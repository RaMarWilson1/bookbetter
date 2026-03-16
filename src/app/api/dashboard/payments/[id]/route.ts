// src/app/api/dashboard/payments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { payments, staffAccounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const [staff] = await db
      .select({ tenantId: staffAccounts.tenantId })
      .from(staffAccounts)
      .where(eq(staffAccounts.userId, session.user.id))
      .limit(1);

    if (!staff) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Only delete payments belonging to this tenant and that are not Stripe
    const [payment] = await db
      .select({ id: payments.id, method: payments.method })
      .from(payments)
      .where(and(eq(payments.id, id), eq(payments.tenantId, staff.tenantId)))
      .limit(1);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.method === 'stripe') {
      return NextResponse.json(
        { error: 'Stripe payments cannot be deleted. Use Stripe Dashboard for refunds.' },
        { status: 400 }
      );
    }

    await db.delete(payments).where(eq(payments.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Payments] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}