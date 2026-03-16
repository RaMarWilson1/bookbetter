// src/app/api/dashboard/stripe-connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { staffAccounts, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// POST — Create a Stripe Connect account and return onboarding link
export async function POST(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get staff account
    const [staff] = await db
      .select({
        id: staffAccounts.id,
        tenantId: staffAccounts.tenantId,
        stripeAccountId: staffAccounts.stripeAccountId,
        stripeOnboardingComplete: staffAccounts.stripeOnboardingComplete,
      })
      .from(staffAccounts)
      .where(eq(staffAccounts.userId, session.user.id))
      .limit(1);

    if (!staff) {
      return NextResponse.json({ error: 'Staff account not found' }, { status: 404 });
    }

    // Get user info for pre-filling
    const [user] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    let accountId = staff.stripeAccountId;

    // Create a new Stripe Connect account if one doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user?.email || undefined,
        business_profile: {
          name: user?.name || undefined,
          product_description: 'Service appointments and bookings',
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      // Save the account ID
      await db
        .update(staffAccounts)
        .set({ stripeAccountId: accountId })
        .where(eq(staffAccounts.id, staff.id));
    }

    // Create an account link for onboarding
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://thebookbetter.com';
    console.log('Stripe Connect using appUrl:', appUrl);
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/dashboard/settings?stripe_refresh=true`,
      return_url: `${appUrl}/api/dashboard/stripe-connect/callback?account_id=${accountId}`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: unknown) {
    console.error('Stripe Connect onboarding error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to start Stripe onboarding', detail: message },
      { status: 500 }
    );
  }
}

// GET — Check Stripe Connect status for the current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [staff] = await db
      .select({
        stripeAccountId: staffAccounts.stripeAccountId,
        stripeOnboardingComplete: staffAccounts.stripeOnboardingComplete,
      })
      .from(staffAccounts)
      .where(eq(staffAccounts.userId, session.user.id))
      .limit(1);

    if (!staff) {
      return NextResponse.json({ error: 'Staff account not found' }, { status: 404 });
    }

    if (!staff.stripeAccountId) {
      return NextResponse.json({
        connected: false,
        onboardingComplete: false,
        accountId: null,
      });
    }

    // Check account status with Stripe
    const account = await stripe.accounts.retrieve(staff.stripeAccountId);

    const onboardingComplete =
      account.charges_enabled && account.payouts_enabled;

    // Update our DB if onboarding just completed
    if (onboardingComplete && !staff.stripeOnboardingComplete) {
      await db
        .update(staffAccounts)
        .set({ stripeOnboardingComplete: true })
        .where(eq(staffAccounts.userId, session.user.id));
    }

    return NextResponse.json({
      connected: true,
      onboardingComplete,
      accountId: staff.stripeAccountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    });
  } catch (error) {
    console.error('Stripe Connect status error:', error);
    return NextResponse.json(
      { error: 'Failed to check Stripe status' },
      { status: 500 }
    );
  }
}