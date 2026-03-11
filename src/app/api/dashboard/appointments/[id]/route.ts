// src/app/api/dashboard/appointments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (body.status) {
      updateData.status = body.status;
      if (body.status === 'cancelled') {
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = body.reason || null;
      }
    }
    if (body.internalNotes !== undefined) updateData.internalNotes = body.internalNotes;

    const [updated] = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, id))
      .returning();

    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error('[Appointments] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}