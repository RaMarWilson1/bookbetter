// src/app/api/dashboard/team/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { staffAccounts, staffInvites } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { hasPermission, type StaffRole } from '@/lib/plan-gating';
import { syncExtraStaffBilling } from '@/lib/staff-billing';

// PUT — update a team member's role
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [staff] = await db
      .select({ tenantId: staffAccounts.tenantId, role: staffAccounts.role })
      .from(staffAccounts)
      .where(eq(staffAccounts.userId, session.user.id))
      .limit(1);

    if (!staff || !hasPermission(staff.role as StaffRole, 'manage:staff')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await req.json();
    const { role } = body;

    if (!['manager', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Can't change owner's role
    const [target] = await db
      .select({ role: staffAccounts.role, userId: staffAccounts.userId })
      .from(staffAccounts)
      .where(
        and(
          eq(staffAccounts.id, id),
          eq(staffAccounts.tenantId, staff.tenantId)
        )
      )
      .limit(1);

    if (!target) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    if (target.role === 'owner') {
      return NextResponse.json({ error: 'Cannot change the owner\'s role' }, { status: 400 });
    }

    // Can't change your own role
    if (target.userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    await db
      .update(staffAccounts)
      .set({ role })
      .where(eq(staffAccounts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Team Update] Error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// DELETE — remove a team member or revoke an invite
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [staff] = await db
      .select({ tenantId: staffAccounts.tenantId, role: staffAccounts.role })
      .from(staffAccounts)
      .where(eq(staffAccounts.userId, session.user.id))
      .limit(1);

    if (!staff || !hasPermission(staff.role as StaffRole, 'manage:staff')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const url = new URL(req.url);
    const type = url.searchParams.get('type');

    if (type === 'invite') {
      // Revoke a pending invite
      await db
        .update(staffInvites)
        .set({ status: 'expired' })
        .where(
          and(
            eq(staffInvites.id, id),
            eq(staffInvites.tenantId, staff.tenantId)
          )
        );
      return NextResponse.json({ success: true });
    }

    // Remove a staff member
    const [target] = await db
      .select({ role: staffAccounts.role, userId: staffAccounts.userId })
      .from(staffAccounts)
      .where(
        and(
          eq(staffAccounts.id, id),
          eq(staffAccounts.tenantId, staff.tenantId)
        )
      )
      .limit(1);

    if (!target) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    if (target.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove the business owner' }, { status: 400 });
    }

    if (target.userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
    }

    // Soft delete — set inactive
    await db
      .update(staffAccounts)
      .set({ active: false })
      .where(eq(staffAccounts.id, id));

    // Sync extra staff billing on Stripe (reduces quantity or removes line item)
    await syncExtraStaffBilling(staff.tenantId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Team Remove] Error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}