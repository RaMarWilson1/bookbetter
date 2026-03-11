// src/app/api/dashboard/settings/logo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { tenants, staffAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
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

    const formData = await req.formData();
    const file = formData.get('logo') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Use JPG, PNG, WebP, or SVG.' },
        { status: 400 }
      );
    }

    // Validate file size (2MB max for a logo)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Max 2MB.' },
        { status: 400 }
      );
    }

    // Get current logo to delete later
    const [currentTenant] = await db
      .select({ logo: tenants.logo })
      .from(tenants)
      .where(eq(tenants.id, staff.tenantId))
      .limit(1);

    // Upload to Vercel Blob
    const blob = await put(`logos/${staff.tenantId}-${Date.now()}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    // Update tenant with new logo URL
    await db
      .update(tenants)
      .set({
        logo: blob.url,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, staff.tenantId));

    // Delete old logo from Blob storage if it exists and is a Vercel Blob URL
    if (currentTenant?.logo && currentTenant.logo.includes('blob.vercel-storage.com')) {
      try {
        await del(currentTenant.logo);
      } catch {
        // Non-critical — old blob might already be gone
      }
    }

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('[Logo Upload] Error:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}

// DELETE — remove current logo
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

    // Get current logo
    const [currentTenant] = await db
      .select({ logo: tenants.logo })
      .from(tenants)
      .where(eq(tenants.id, staff.tenantId))
      .limit(1);

    // Delete from Blob storage
    if (currentTenant?.logo && currentTenant.logo.includes('blob.vercel-storage.com')) {
      try {
        await del(currentTenant.logo);
      } catch {
        // Non-critical
      }
    }

    // Clear logo from tenant
    await db
      .update(tenants)
      .set({ logo: null, updatedAt: new Date() })
      .where(eq(tenants.id, staff.tenantId));

    return NextResponse.json({ message: 'Logo removed' });
  } catch (error) {
    console.error('[Logo Delete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to remove logo' },
      { status: 500 }
    );
  }
}