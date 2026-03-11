// src/app/api/dashboard/availability/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { availabilityTemplates } from '@/db/schema';
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

    const [updated] = await db
      .update(availabilityTemplates)
      .set({
        ...(body.startTime !== undefined && { startTime: body.startTime }),
        ...(body.endTime !== undefined && { endTime: body.endTime }),
        ...(body.active !== undefined && { active: body.active }),
      })
      .where(eq(availabilityTemplates.id, id))
      .returning();

    return NextResponse.json({ template: updated });
  } catch (error) {
    console.error('[Availability] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    await db.delete(availabilityTemplates).where(eq(availabilityTemplates.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Availability] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}