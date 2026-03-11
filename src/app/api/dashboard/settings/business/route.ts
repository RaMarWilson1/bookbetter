// src/app/api/dashboard/settings/business/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();

    const [updated] = await db
      .update(tenants)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.city !== undefined && { city: body.city || null }),
        ...(body.state !== undefined && { state: body.state || null }),
        ...(body.postalCode !== undefined && { postalCode: body.postalCode || null }),
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, body.tenantId))
      .returning();

    return NextResponse.json({ tenant: updated });
  } catch (error) {
    console.error('[Settings] Business PUT error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}