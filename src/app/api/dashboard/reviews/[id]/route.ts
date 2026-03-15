// src/app/api/dashboard/reviews/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { reviews, staffAccounts, tenants } from '@/db/schema';
import { eq, and, gte, or, isNotNull } from 'drizzle-orm';

const MONTHLY_MODERATION_LIMIT = 10;

async function getStaffContext(userId: string) {
  const [staff] = await db
    .select({
      tenantId: staffAccounts.tenantId,
      role: staffAccounts.role,
    })
    .from(staffAccounts)
    .where(eq(staffAccounts.userId, userId))
    .limit(1);

  if (!staff) return null;

  const [tenant] = await db
    .select({ plan: tenants.plan })
    .from(tenants)
    .where(eq(tenants.id, staff.tenantId))
    .limit(1);

  return { ...staff, plan: tenant?.plan || 'starter' };
}

/**
 * Count how many hide + delete actions this tenant has used this month.
 * Hides = reviews where hiddenAt is this month
 * Deletes = reviews where deletedAt is this month (soft-deleted)
 */
async function getModerationCountThisMonth(tenantId: string): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const moderated = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(
      and(
        eq(reviews.tenantId, tenantId),
        or(
          gte(reviews.hiddenAt, monthStart),
          gte(reviews.deletedAt, monthStart)
        )
      )
    );

  return moderated.length;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const ctx = await getStaffContext(session.user.id);

    if (!ctx) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    // Verify review belongs to this tenant and isn't soft-deleted
    const [review] = await db
      .select({
        id: reviews.id,
        tenantId: reviews.tenantId,
        approved: reviews.approved,
        hiddenAt: reviews.hiddenAt,
        deletedAt: reviews.deletedAt,
      })
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);

    if (!review || review.tenantId !== ctx.tenantId || review.deletedAt) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    // Handle response (Growth+ only)
    if (body.response !== undefined) {
      if (ctx.plan === 'starter') {
        return NextResponse.json(
          { error: 'Upgrade to Growth to respond to reviews' },
          { status: 403 }
        );
      }
      updateData.response = body.response;
      updateData.respondedAt = new Date();
    }

    // Handle approved/hidden toggle (Growth+ owner only)
    if (body.approved !== undefined) {
      if (ctx.plan === 'starter') {
        return NextResponse.json(
          { error: 'Upgrade to Growth to manage review visibility' },
          { status: 403 }
        );
      }
      if (ctx.role !== 'owner') {
        return NextResponse.json(
          { error: 'Only the business owner can hide reviews' },
          { status: 403 }
        );
      }

      const isHiding = body.approved === false;
      const wasAlreadyHidden = review.approved === false;

      // Only count against the cap if this is a NEW hide (not unhiding or re-hiding)
      if (isHiding && !wasAlreadyHidden) {
        const usedThisMonth = await getModerationCountThisMonth(ctx.tenantId);
        if (usedThisMonth >= MONTHLY_MODERATION_LIMIT) {
          return NextResponse.json(
            {
              error: `You\u2019ve reached the limit of ${MONTHLY_MODERATION_LIMIT} review hides/removals this month. This resets on the 1st.`,
              limit: MONTHLY_MODERATION_LIMIT,
              used: usedThisMonth,
            },
            { status: 429 }
          );
        }
        updateData.hiddenAt = new Date();
      }

      // If unhiding, clear the hiddenAt (frees up the slot for future counts — optional)
      if (!isHiding && wasAlreadyHidden) {
        updateData.hiddenAt = null;
      }

      updateData.approved = body.approved;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No changes' }, { status: 400 });
    }

    const [updated] = await db
      .update(reviews)
      .set(updateData)
      .where(eq(reviews.id, id))
      .returning();

    return NextResponse.json({ review: updated });
  } catch (error) {
    console.error('[Reviews] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
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
    const ctx = await getStaffContext(session.user.id);

    if (!ctx) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    // Owner only
    if (ctx.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only the business owner can delete reviews' },
        { status: 403 }
      );
    }

    // Plan check
    if (ctx.plan === 'starter') {
      return NextResponse.json(
        { error: 'Upgrade to Growth to manage reviews' },
        { status: 403 }
      );
    }

    // Verify review belongs to this tenant
    const [review] = await db
      .select({ id: reviews.id, tenantId: reviews.tenantId, deletedAt: reviews.deletedAt })
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);

    if (!review || review.tenantId !== ctx.tenantId || review.deletedAt) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Check monthly cap
    const usedThisMonth = await getModerationCountThisMonth(ctx.tenantId);
    if (usedThisMonth >= MONTHLY_MODERATION_LIMIT) {
      return NextResponse.json(
        {
          error: `You\u2019ve reached the limit of ${MONTHLY_MODERATION_LIMIT} review hides/removals this month. This resets on the 1st.`,
          limit: MONTHLY_MODERATION_LIMIT,
          used: usedThisMonth,
        },
        { status: 429 }
      );
    }

    // Soft-delete: mark as deleted instead of removing from DB
    await db
      .update(reviews)
      .set({ deletedAt: new Date(), approved: false })
      .where(eq(reviews.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Reviews] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}