// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { inAppNotifications } from '@/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';

// GET — Fetch notifications for the current user
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
  const unreadOnly = req.nextUrl.searchParams.get('unread') === 'true';

  try {
    const where = unreadOnly
      ? and(eq(inAppNotifications.userId, session.user.id), eq(inAppNotifications.read, false))
      : eq(inAppNotifications.userId, session.user.id);

    const items = await db
      .select()
      .from(inAppNotifications)
      .where(where)
      .orderBy(desc(inAppNotifications.createdAt))
      .limit(limit);

    // Get unread count
    const [unreadCount] = await db
      .select({ count: count() })
      .from(inAppNotifications)
      .where(
        and(
          eq(inAppNotifications.userId, session.user.id),
          eq(inAppNotifications.read, false)
        )
      );

    return NextResponse.json({
      notifications: items,
      unreadCount: unreadCount?.count || 0,
    });
  } catch (error) {
    console.error('[Notifications] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// PUT — Mark notifications as read
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();

    // Mark all as read
    if (body.action === 'mark_all_read') {
      await db
        .update(inAppNotifications)
        .set({ read: true })
        .where(
          and(
            eq(inAppNotifications.userId, session.user.id),
            eq(inAppNotifications.read, false)
          )
        );
      return NextResponse.json({ success: true });
    }

    // Mark single as read
    if (body.id) {
      await db
        .update(inAppNotifications)
        .set({ read: true })
        .where(
          and(
            eq(inAppNotifications.id, body.id),
            eq(inAppNotifications.userId, session.user.id)
          )
        );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Notifications] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}