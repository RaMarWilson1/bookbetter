// src/app/api/dashboard/settings/gallery/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { tenants, staffAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { put, del } from '@vercel/blob';

export async function POST(req: NextRequest) {
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

    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPG, PNG, or WebP.' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 });
    }

    // Check gallery limit (max 6 images)
    const [tenant] = await db
      .select({ galleryImages: tenants.galleryImages })
      .from(tenants)
      .where(eq(tenants.id, staff.tenantId))
      .limit(1);

    const existing: string[] = tenant?.galleryImages ? JSON.parse(tenant.galleryImages) : [];
    if (existing.length >= 6) {
      return NextResponse.json({ error: 'Gallery limit reached (6 images max)' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const blob = await put(
      `gallery/${staff.tenantId}/${Date.now()}.${ext}`,
      file,
      { access: 'public' }
    );

    const updated = [...existing, blob.url];
    await db
      .update(tenants)
      .set({ galleryImages: JSON.stringify(updated), updatedAt: new Date() })
      .where(eq(tenants.id, staff.tenantId));

    return NextResponse.json({ url: blob.url, gallery: updated });
  } catch (error) {
    console.error('[Gallery] Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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

    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    // Remove from Blob storage
    try {
      await del(url);
    } catch {
      // Blob may already be deleted — continue
    }

    // Remove from gallery array
    const [tenant] = await db
      .select({ galleryImages: tenants.galleryImages })
      .from(tenants)
      .where(eq(tenants.id, staff.tenantId))
      .limit(1);

    const existing: string[] = tenant?.galleryImages ? JSON.parse(tenant.galleryImages) : [];
    const updated = existing.filter((u) => u !== url);

    await db
      .update(tenants)
      .set({ galleryImages: JSON.stringify(updated), updatedAt: new Date() })
      .where(eq(tenants.id, staff.tenantId));

    return NextResponse.json({ gallery: updated });
  } catch (error) {
    console.error('[Gallery] Delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}