// src/app/api/dashboard/settings/avatar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Use JPG, PNG, or WebP.' },
        { status: 400 }
      );
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Max 2MB.' },
        { status: 400 }
      );
    }

    // Get current image to delete later
    const [currentUser] = await db
      .select({ image: users.image })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    // Upload to Vercel Blob
    const blob = await put(`avatars/${session.user.id}-${Date.now()}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    // Update user image
    await db
      .update(users)
      .set({
        image: blob.url,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    // Delete old avatar from Blob if it's a Vercel Blob URL
    if (currentUser?.image && currentUser.image.includes('blob.vercel-storage.com')) {
      try {
        await del(currentUser.image);
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('[Avatar Upload] Error:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [currentUser] = await db
      .select({ image: users.image })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (currentUser?.image && currentUser.image.includes('blob.vercel-storage.com')) {
      try {
        await del(currentUser.image);
      } catch {
        // Non-critical
      }
    }

    await db
      .update(users)
      .set({ image: null, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ message: 'Photo removed' });
  } catch (error) {
    console.error('[Avatar Delete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to remove photo' },
      { status: 500 }
    );
  }
}