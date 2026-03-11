// src/app/api/dashboard/services/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { services } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const [updated] = await db
      .update(services)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.priceCents !== undefined && { priceCents: body.priceCents }),
        ...(body.durationMinutes !== undefined && { durationMinutes: body.durationMinutes }),
        ...(body.depositCents !== undefined && { depositCents: body.depositCents || null }),
        ...(body.fullPayRequired !== undefined && { fullPayRequired: body.fullPayRequired }),
        ...(body.bufferMinutes !== undefined && { bufferMinutes: body.bufferMinutes }),
        ...(body.active !== undefined && { active: body.active }),
        updatedAt: new Date(),
      })
      .where(eq(services.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ service: updated });
  } catch (error) {
    console.error('[Services] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    await db.delete(services).where(eq(services.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Services] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}