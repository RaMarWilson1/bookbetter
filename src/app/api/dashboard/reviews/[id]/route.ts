// src/app/api/dashboard/reviews/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { reviews } from '@/db/schema';
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
      .update(reviews)
      .set({
        response: body.response,
        respondedAt: new Date(),
      })
      .where(eq(reviews.id, id))
      .returning();

    return NextResponse.json({ review: updated });
  } catch (error) {
    console.error('[Reviews] PUT error:', error);
    return NextResponse.json({ error: 'Failed to respond' }, { status: 500 });
  }
}