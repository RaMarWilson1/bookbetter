// src/app/api/dashboard/settings/branding/route.ts
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
    // Find user's tenant
    const [staff] = await db
      .select({ tenantId: staffAccounts.tenantId })
      .from(staffAccounts)
      .where(eq(staffAccounts.userId, session.user.id))
      .limit(1);

    if (!staff) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const body = await req.json();
    const { primaryColor, secondaryColor, logo, showPoweredBy } = body;

    // Check plan for showPoweredBy gating — Starter always shows badge
    let poweredByValue: boolean | undefined;
    if (showPoweredBy !== undefined) {
      const [tenant] = await db
        .select({ plan: tenants.plan })
        .from(tenants)
        .where(eq(tenants.id, staff.tenantId))
        .limit(1);

      if (tenant?.plan === 'starter' && showPoweredBy === false) {
        // Starter can't disable — silently ignore
        poweredByValue = undefined;
      } else {
        poweredByValue = showPoweredBy;
      }
    }

    await db
      .update(tenants)
      .set({
        primaryColor: primaryColor || '#3B82F6',
        secondaryColor: secondaryColor || '#10B981',
        logo: logo || null,
        ...(poweredByValue !== undefined ? { showPoweredBy: poweredByValue } : {}),
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, staff.tenantId));

    return NextResponse.json({ message: 'Branding updated' });
  } catch (error) {
    console.error('[Branding] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}