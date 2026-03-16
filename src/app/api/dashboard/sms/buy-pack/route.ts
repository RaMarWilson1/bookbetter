// src/app/api/dashboard/sms/buy-pack/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { staffAccounts, tenants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';

const PACK_PRICE_CENTS = 250; // $2.50 for 100 SMS
const PACK_SMS_COUNT = 100;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://thebookbetter.com';

// POST — Create a Stripe Checkout session for an SMS pack
export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [staff] = await db
      .select({
        tenantId: staffAccounts.tenantId,
      })
      .from(staffAccounts)
      .where(
        and(
          eq(staffAccounts.userId, session.user.id),
          eq(staffAccounts.role, 'owner')
        )
      )
      .limit(1);

    if (!staff) return NextResponse.json({ error: 'No tenant found' }, { status: 404 });

    // Get tenant's Stripe customer ID
    const [tenant] = await db
      .select({
        stripeCustomerId: tenants.stripeCustomerId,
        plan: tenants.plan,
      })
      .from(tenants)
      .where(eq(tenants.id, staff.tenantId))
      .limit(1);

    if (!tenant || tenant.plan === 'starter') {
      return NextResponse.json({ error: 'SMS packs require Growth or Business plan' }, { status: 403 });
    }

    // Create Checkout Session for the SMS pack
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: tenant.stripeCustomerId || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'SMS Pack — 100 messages',
              description: '100 SMS credits for your BookBetter account ($0.025/SMS)',
            },
            unit_amount: PACK_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      metadata: {
        tenantId: staff.tenantId,
        type: 'sms_pack',
        smsCount: String(PACK_SMS_COUNT),
      },
      success_url: `${APP_URL}/dashboard/settings?tab=notifications&sms_pack=success`,
      cancel_url: `${APP_URL}/dashboard/settings?tab=notifications&sms_pack=cancelled`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('[SMS Pack] Error creating checkout:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}

// This webhook handler should be added to your existing Stripe webhook route
// to handle the `checkout.session.completed` event for SMS packs:
//
// if (event.type === 'checkout.session.completed') {
//   const session = event.data.object;
//   if (session.metadata?.type === 'sms_pack') {
//     const tenantId = session.metadata.tenantId;
//     const smsCount = parseInt(session.metadata.smsCount || '100');
//     await db.update(tenants)
//       .set({ smsPackBalance: sql`${tenants.smsPackBalance} + ${smsCount}` })
//       .where(eq(tenants.id, tenantId));
//   }
// }