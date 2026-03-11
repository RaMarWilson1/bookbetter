// src/app/api/dashboard/settings/slug/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { tenants, staffAccounts } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find user's tenant
    const [staff] = await db
      .select({ tenantId: staffAccounts.tenantId })
      .from(staffAccounts)
      .where(eq(staffAccounts.userId, session.user.id))
      .limit(1);

    if (!staff) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const body = await req.json();
    let { slug } = body;

    // Sanitize: lowercase, only letters/numbers/hyphens, no leading/trailing hyphens
    slug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '');

    if (!slug || slug.length < 3) {
      return NextResponse.json(
        { error: 'Link must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (slug.length > 60) {
      return NextResponse.json(
        { error: 'Link must be 60 characters or less' },
        { status: 400 }
      );
    }

    // Reserved slugs
    const reserved = ['admin', 'api', 'auth', 'book', 'dashboard', 'search', 'settings', 'onboarding', 'cancel'];
    if (reserved.includes(slug)) {
      return NextResponse.json(
        { error: 'This link is reserved. Try a different one.' },
        { status: 400 }
      );
    }

    // Check uniqueness (exclude current tenant)
    const [existing] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(and(eq(tenants.slug, slug), ne(tenants.id, staff.tenantId)))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: 'This link is already taken. Try a different one.' },
        { status: 409 }
      );
    }

    // Update
    await db
      .update(tenants)
      .set({ slug, updatedAt: new Date() })
      .where(eq(tenants.id, staff.tenantId));

    return NextResponse.json({ slug });
  } catch (error) {
    console.error('[Slug Update] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}