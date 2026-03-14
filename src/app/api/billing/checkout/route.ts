// src/app/api/billing/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { tenants, staffAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { stripe, PLANS, type PlanKey } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { plan, interval, coupon } = body as {
      plan: PlanKey;
      interval: 'monthly' | 'annual';
      coupon?: string;
    };

    // Validate plan
    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    if (plan === 'starter') {
      return NextResponse.json({ error: 'Starter plan is free — no checkout needed' }, { status: 400 });
    }

    const planConfig = PLANS[plan];
    const priceId = interval === 'annual'
      ? planConfig.stripePriceIdAnnual
      : planConfig.stripePriceIdMonthly;

    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured' }, { status: 500 });
    }

    // Get tenant
    const [staff] = await db
      .select({ tenantId: staffAccounts.tenantId, role: staffAccounts.role })
      .from(staffAccounts)
      .where(eq(staffAccounts.userId, session.user.id))
      .limit(1);

    if (!staff) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    // Only owners can change billing
    if (staff.role !== 'owner') {
      return NextResponse.json({ error: 'Only the business owner can manage billing' }, { status: 403 });
    }

    const [tenant] = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        stripeCustomerId: tenants.stripeCustomerId,
        email: tenants.email,
      })
      .from(tenants)
      .where(eq(tenants.id, staff.tenantId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Create or reuse Stripe customer
    let customerId = tenant.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: tenant.email || session.user.email || undefined,
        name: tenant.name,
        metadata: {
          tenantId: tenant.id,
        },
      });
      customerId = customer.id;

      await db
        .update(tenants)
        .set({ stripeCustomerId: customerId })
        .where(eq(tenants.id, tenant.id));
    }

    // Build base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Validate coupon if provided
    let validCouponId: string | undefined;
    if (coupon && coupon.trim()) {
      try {
        // Try as a promotion code first (user-facing codes)
        const promoCodes = await stripe.promotionCodes.list({
          code: coupon.trim(),
          active: true,
          limit: 1,
        });

        if (promoCodes.data.length > 0) {
          // Use the promotion code's underlying coupon
          const promoCoupon = promoCodes.data[0].promotion.coupon;
          validCouponId = typeof promoCoupon === 'string' ? promoCoupon : promoCoupon?.id;
        } else {
          // Try as a direct coupon ID
          const stripeCoupon = await stripe.coupons.retrieve(coupon.trim());
          if (stripeCoupon && stripeCoupon.valid) {
            validCouponId = stripeCoupon.id;
          }
        }
      } catch {
        // Invalid coupon — Stripe throws if coupon doesn't exist
      }

      if (coupon.trim() && !validCouponId) {
        return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 400 });
      }
    }

    // Create Checkout Session
    // If a coupon was provided, apply it directly via discounts
    // Otherwise, allow users to enter promo codes on the Stripe checkout page
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      ...(validCouponId
        ? { discounts: [{ coupon: validCouponId }] }
        : { allow_promotion_codes: true }),
      success_url: `${baseUrl}/dashboard/settings/billing?success=true`,
      cancel_url: `${baseUrl}/dashboard/settings/billing?canceled=true`,
      subscription_data: {
        metadata: {
          tenantId: tenant.id,
          plan,
        },
      },
      metadata: {
        tenantId: tenant.id,
        plan,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('[Billing Checkout] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}