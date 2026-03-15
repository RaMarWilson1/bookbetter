// src/app/api/dashboard/settings/booking-page/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { tenants, staffAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [staff] = await db
    .select({ tenantId: staffAccounts.tenantId })
    .from(staffAccounts)
    .where(eq(staffAccounts.userId, session.user.id))
    .limit(1);

  if (!staff) {
    return NextResponse.json({ error: 'No business found' }, { status: 404 });
  }

  const [tenant] = await db
    .select({
      bio: tenants.bio,
      coverImage: tenants.coverImage,
      galleryImages: tenants.galleryImages,
      socialInstagram: tenants.socialInstagram,
      socialFacebook: tenants.socialFacebook,
      socialTiktok: tenants.socialTiktok,
      socialTwitter: tenants.socialTwitter,
      socialWebsite: tenants.socialWebsite,
    })
    .from(tenants)
    .where(eq(tenants.id, staff.tenantId))
    .limit(1);

  return NextResponse.json(tenant || {});
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [staff] = await db
      .select({ tenantId: staffAccounts.tenantId })
      .from(staffAccounts)
      .where(eq(staffAccounts.userId, session.user.id))
      .limit(1);

    if (!staff) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const body = await req.json();

    await db
      .update(tenants)
      .set({
        bio: body.bio ?? null,
        coverImage: body.coverImage ?? null,
        galleryImages: body.galleryImages ?? null,
        socialInstagram: body.socialInstagram ?? null,
        socialFacebook: body.socialFacebook ?? null,
        socialTiktok: body.socialTiktok ?? null,
        socialTwitter: body.socialTwitter ?? null,
        socialWebsite: body.socialWebsite ?? null,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, staff.tenantId));

    return NextResponse.json({ message: 'Booking page updated' });
  } catch (error) {
    console.error('[BookingPage] Error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}