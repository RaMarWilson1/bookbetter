// src/app/api/dashboard/settings/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();

    const [updated] = await db
      .update(users)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.timeZone !== undefined && { timeZone: body.timeZone }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning();

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('[Settings] Profile PUT error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}