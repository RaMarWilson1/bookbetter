// src/app/api/invite/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { staffInvites, staffAccounts, users, tenants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { syncExtraStaffBilling } from '@/lib/staff-billing';

// GET — check invite details (public, no auth needed)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const [invite] = await db
      .select({
        id: staffInvites.id,
        email: staffInvites.email,
        role: staffInvites.role,
        status: staffInvites.status,
        expiresAt: staffInvites.expiresAt,
        tenantName: tenants.name,
      })
      .from(staffInvites)
      .innerJoin(tenants, eq(staffInvites.tenantId, tenants.id))
      .where(eq(staffInvites.token, token))
      .limit(1);

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'This invite has already been used or expired' }, { status: 400 });
    }

    if (new Date() > invite.expiresAt) {
      return NextResponse.json({ error: 'This invite has expired' }, { status: 400 });
    }

    return NextResponse.json({
      email: invite.email,
      role: invite.role,
      businessName: invite.tenantName,
    });
  } catch (error) {
    console.error('[Invite Check] Error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// POST — accept the invite (requires auth)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Please sign in first' }, { status: 401 });
  }

  try {
    const [invite] = await db
      .select()
      .from(staffInvites)
      .where(eq(staffInvites.token, token))
      .limit(1);

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'This invite has already been used or expired' }, { status: 400 });
    }

    if (new Date() > invite.expiresAt) {
      // Mark as expired
      await db
        .update(staffInvites)
        .set({ status: 'expired' })
        .where(eq(staffInvites.id, invite.id));
      return NextResponse.json({ error: 'This invite has expired' }, { status: 400 });
    }

    // Verify the email matches (case-insensitive)
    const userEmail = session.user.email?.toLowerCase();
    if (userEmail !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: `This invite was sent to ${invite.email}. Please sign in with that email.` },
        { status: 403 }
      );
    }

    // Check if already a member
    const [existingStaff] = await db
      .select({ id: staffAccounts.id })
      .from(staffAccounts)
      .where(
        and(
          eq(staffAccounts.tenantId, invite.tenantId),
          eq(staffAccounts.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingStaff) {
      // Mark invite as accepted anyway
      await db
        .update(staffInvites)
        .set({ status: 'accepted', acceptedAt: new Date() })
        .where(eq(staffInvites.id, invite.id));
      return NextResponse.json({ error: 'You are already on this team' }, { status: 400 });
    }

    // Create staff account
    await db.insert(staffAccounts).values({
      tenantId: invite.tenantId,
      userId: session.user.id,
      role: invite.role,
    });

    // Update user role to staff if they were a client
    await db
      .update(users)
      .set({ role: 'staff', updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    // Mark invite as accepted
    await db
      .update(staffInvites)
      .set({ status: 'accepted', acceptedAt: new Date() })
      .where(eq(staffInvites.id, invite.id));

    // Sync extra staff billing on Stripe (adds/updates line item if > 5 staff)
    await syncExtraStaffBilling(invite.tenantId);

    return NextResponse.json({ success: true, tenantId: invite.tenantId });
  } catch (error) {
    console.error('[Invite Accept] Error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}