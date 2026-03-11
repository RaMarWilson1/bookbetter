// src/app/api/dashboard/services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { services } from '@/db/schema';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, name, description, priceCents, durationMinutes, depositCents, fullPayRequired, bufferMinutes, active } = body;

    if (!tenantId || !name || !priceCents || !durationMinutes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [newService] = await db
      .insert(services)
      .values({
        tenantId,
        name,
        description: description || null,
        priceCents,
        durationMinutes,
        depositCents: depositCents || null,
        fullPayRequired: fullPayRequired || false,
        bufferMinutes: bufferMinutes || 0,
        active: active ?? true,
      })
      .returning();

    return NextResponse.json({ service: newService }, { status: 201 });
  } catch (error) {
    console.error('[Services] POST error:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}