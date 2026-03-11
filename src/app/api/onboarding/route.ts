// src/app/api/onboarding/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users, tenants, staffAccounts, services } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      userId,
      businessName,
      slug,
      category,
      phone,
      address,
      city,
      state,
      postalCode,
      timeZone,
      serviceName,
      servicePriceCents,
      serviceDurationMinutes,
    } = body;

    // Validate required fields
    if (!businessName || !slug) {
      return NextResponse.json(
        { error: 'Business name and URL are required' },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existingSlug = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    if (existingSlug[0]) {
      return NextResponse.json(
        { error: 'This booking URL is already taken. Please choose a different one.' },
        { status: 409 }
      );
    }

    // Check if user already has a tenant
    const existingStaff = await db
      .select({ id: staffAccounts.id })
      .from(staffAccounts)
      .where(eq(staffAccounts.userId, userId))
      .limit(1);

    if (existingStaff[0]) {
      return NextResponse.json(
        { error: 'You already have a business set up' },
        { status: 409 }
      );
    }

    // Create tenant
    const [newTenant] = await db
      .insert(tenants)
      .values({
        name: businessName,
        slug,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        postalCode: postalCode || null,
        timeZone: timeZone || 'America/New_York',
        email: session.user.email,
      })
      .returning();

    // Create staff account (owner)
    await db.insert(staffAccounts).values({
      tenantId: newTenant.id,
      userId,
      role: 'owner',
    });

    // Update user role to 'pro'
    await db
      .update(users)
      .set({ role: 'pro', updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Create first service if provided
    if (serviceName && servicePriceCents && serviceDurationMinutes) {
      await db.insert(services).values({
        tenantId: newTenant.id,
        name: serviceName,
        priceCents: servicePriceCents,
        durationMinutes: serviceDurationMinutes,
        active: true,
      });
    }

    return NextResponse.json(
      {
        tenant: newTenant,
        message: 'Business created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Onboarding] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}