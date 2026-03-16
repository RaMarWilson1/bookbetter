// src/app/api/dashboard/team/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { tenants, staffAccounts, staffInvites, users } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { hasPermission, type StaffRole } from '@/lib/plan-gating';
import { getPlanLimits, type PlanKey } from '@/lib/stripe';
import { randomBytes } from 'crypto';
import { sendEmail } from '@/lib/email';
import { teamInviteEmail } from '@/lib/email-templates';

// GET — list team members + pending invites
export async function GET() {
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

    if (!staff) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    // Get all staff members with user details
    const members = await db
      .select({
        id: staffAccounts.id,
        userId: staffAccounts.userId,
        role: staffAccounts.role,
        active: staffAccounts.active,
        createdAt: staffAccounts.createdAt,
        name: users.name,
        email: users.email,
        image: users.image,
        stripeAccountId: staffAccounts.stripeAccountId,
        stripeOnboardingComplete: staffAccounts.stripeOnboardingComplete,
      })
      .from(staffAccounts)
      .innerJoin(users, eq(staffAccounts.userId, users.id))
      .where(eq(staffAccounts.tenantId, staff.tenantId));

    // Get pending invites
    const invites = await db
      .select({
        id: staffInvites.id,
        email: staffInvites.email,
        role: staffInvites.role,
        status: staffInvites.status,
        createdAt: staffInvites.createdAt,
        expiresAt: staffInvites.expiresAt,
      })
      .from(staffInvites)
      .where(
        and(
          eq(staffInvites.tenantId, staff.tenantId),
          eq(staffInvites.status, 'pending')
        )
      );

    return NextResponse.json({ members, invites });
  } catch (error) {
    console.error('[Team List] Error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// POST — send an invite
export async function POST(req: NextRequest) {
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

    if (!staff) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    // Check permission
    if (!hasPermission(staff.role as StaffRole, 'manage:staff')) {
      return NextResponse.json({ error: 'You don\'t have permission to invite team members' }, { status: 403 });
    }

    // Check plan allows multi-staff
    const [tenant] = await db
      .select({ plan: tenants.plan, name: tenants.name })
      .from(tenants)
      .where(eq(tenants.id, staff.tenantId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const limits = getPlanLimits(tenant.plan as PlanKey);

    if (limits.maxStaff <= 1) {
      return NextResponse.json(
        { error: 'Your plan doesn\'t support team members. Upgrade to Business to add staff.' },
        { status: 403 }
      );
    }

    // Count current active staff
    const [staffCount] = await db
      .select({ count: count() })
      .from(staffAccounts)
      .where(
        and(
          eq(staffAccounts.tenantId, staff.tenantId),
          eq(staffAccounts.active, true)
        )
      );

    const currentStaff = staffCount?.count || 0;

    // Count pending invites
    const [inviteCount] = await db
      .select({ count: count() })
      .from(staffInvites)
      .where(
        and(
          eq(staffInvites.tenantId, staff.tenantId),
          eq(staffInvites.status, 'pending')
        )
      );

    const pendingInvites = inviteCount?.count || 0;

    // Business plan base is 5, but extras are allowed (billed separately)
    // For now, soft limit at 15 total
    if (currentStaff + pendingInvites >= 15) {
      return NextResponse.json(
        { error: 'Maximum team size reached. Contact support for larger teams.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { email, role } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const inviteRole = role === 'manager' ? 'manager' : 'staff';

    // Check if already a team member
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      const existingStaff = await db
        .select({ id: staffAccounts.id })
        .from(staffAccounts)
        .where(
          and(
            eq(staffAccounts.tenantId, staff.tenantId),
            eq(staffAccounts.userId, existingUser[0].id)
          )
        )
        .limit(1);

      if (existingStaff.length > 0) {
        return NextResponse.json(
          { error: 'This person is already on your team' },
          { status: 400 }
        );
      }
    }

    // Check if already invited
    const existingInvite = await db
      .select({ id: staffInvites.id })
      .from(staffInvites)
      .where(
        and(
          eq(staffInvites.tenantId, staff.tenantId),
          eq(staffInvites.email, email.toLowerCase()),
          eq(staffInvites.status, 'pending')
        )
      )
      .limit(1);

    if (existingInvite.length > 0) {
      return NextResponse.json(
        { error: 'An invite is already pending for this email' },
        { status: 400 }
      );
    }

    // Create invite
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

    const [invite] = await db
      .insert(staffInvites)
      .values({
        tenantId: staff.tenantId,
        email: email.toLowerCase(),
        role: inviteRole,
        invitedBy: session.user.id,
        token,
        expiresAt,
      })
      .returning();

    // Send invite email via Resend
    const emailTemplate = teamInviteEmail({
      inviteeEmail: email.toLowerCase(),
      businessName: tenant.name || 'a business',
      role: inviteRole,
      inviterName: session.user.name || 'Your teammate',
      token,
    });

    sendEmail({
      to: email.toLowerCase(),
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      userId: session.user.id,
      purpose: 'team_invite',
    }).catch((err) => console.error('[Team Invite] Email send error:', err));

    // Calculate if this invite will trigger extra staff billing
    const INCLUDED_STAFF = 5;
    const totalAfterAccept = currentStaff + 1; // +1 for when this invite is accepted
    const willIncurExtraCost = totalAfterAccept > INCLUDED_STAFF;
    const extraStaffCount = Math.max(0, totalAfterAccept - INCLUDED_STAFF);

    return NextResponse.json({
      invite,
      billing: willIncurExtraCost
        ? {
            extraStaff: extraStaffCount,
            costPerMonth: extraStaffCount * 10, // $10/mo each
            message: `This will bring your team to ${totalAfterAccept} members. You'll be billed $${extraStaffCount * 10}/mo for ${extraStaffCount} extra staff beyond the included 5.`,
          }
        : null,
    });
  } catch (error) {
    console.error('[Team Invite] Error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}