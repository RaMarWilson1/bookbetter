// src/app/api/dashboard/availability/exceptions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { availabilityExceptions } from '@/db/schema';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const [exception] = await db
      .insert(availabilityExceptions)
      .values({
        tenantId: body.tenantId,
        startUtc: new Date(body.startUtc),
        endUtc: new Date(body.endUtc),
        reason: body.reason || null,
      })
      .returning();

    return NextResponse.json({ exception }, { status: 201 });
  } catch (error) {
    console.error('[Exceptions] POST error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}