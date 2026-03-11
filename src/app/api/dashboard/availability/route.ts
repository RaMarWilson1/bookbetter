// src/app/api/dashboard/availability/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { availabilityTemplates } from '@/db/schema';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const [template] = await db
      .insert(availabilityTemplates)
      .values({
        tenantId: body.tenantId,
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
      })
      .returning();

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('[Availability] POST error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}