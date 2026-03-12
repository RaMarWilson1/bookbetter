// src/app/api/dashboard/stripe-connect/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { staffAccounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/auth/sign-in', req.url));
    }

    const accountId = req.nextUrl.searchParams.get('account_id');
    if (!accountId) {
      return NextResponse.redirect(new URL('/dashboard/settings?stripe_error=missing_account', req.url));
    }

    // Verify this account belongs to the current user
    const [staff] = await db
      .select({ id: staffAccounts.id, stripeAccountId: staffAccounts.stripeAccountId })
      .from(staffAccounts)
      .where(
        and(
          eq(staffAccounts.userId, session.user.id),
          eq(staffAccounts.stripeAccountId, accountId)
        )
      )
      .limit(1);

    if (!staff) {
      return NextResponse.redirect(new URL('/dashboard/settings?stripe_error=not_found', req.url));
    }

    // Check account status
    const account = await stripe.accounts.retrieve(accountId);
    const onboardingComplete = account.charges_enabled && account.payouts_enabled;

    if (onboardingComplete) {
      await db
        .update(staffAccounts)
        .set({ stripeOnboardingComplete: true })
        .where(eq(staffAccounts.id, staff.id));

      return NextResponse.redirect(
        new URL('/dashboard/settings?stripe_connected=true', req.url)
      );
    }

    // If onboarding isn't complete, they may need to finish
    return NextResponse.redirect(
      new URL('/dashboard/settings?stripe_pending=true', req.url)
    );
  } catch (error) {
    console.error('Stripe Connect callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings?stripe_error=callback_failed', req.url)
    );
  }
}