// src/app/api/billing/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { tenants, bookings, paymentIntents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type Stripe from 'stripe';
import type { PlanKey } from '@/lib/stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    console.error('[Stripe Webhook] Signature verification failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenantId;

        // Handle SMS pack purchase
        if (session.metadata?.type === 'sms_pack' && tenantId) {
          const smsCount = parseInt(session.metadata.smsCount || '100');
          await db
            .update(tenants)
            .set({ smsPackBalance: sql`${tenants.smsPackBalance} + ${smsCount}` })
            .where(eq(tenants.id, tenantId));
          console.log(`[Stripe Webhook] SMS pack: +${smsCount} credits for tenant ${tenantId}`);
          break;
        }

        // Handle plan subscription
        const plan = session.metadata?.plan as PlanKey;

        if (tenantId && plan) {
          await db
            .update(tenants)
            .set({
              plan,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              planStartedAt: new Date(),
              planEndsAt: null,
              // Set quotas based on plan
              bookingsQuota: plan === 'starter' ? 15 : 999999,
              smsQuota: plan === 'business' ? 200 : plan === 'growth' ? 50 : 0,
              smsUsed: 0, // Reset on new plan
              updatedAt: new Date(),
            })
            .where(eq(tenants.id, tenantId));
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata?.tenantId;

        if (tenantId) {
          const plan = subscription.metadata?.plan as PlanKey || 'starter';
          const status = subscription.status;

          // If subscription is active, update plan
          if (status === 'active' || status === 'trialing') {
            await db
              .update(tenants)
              .set({
                plan,
                planEndsAt: null,
                bookingsQuota: plan === 'starter' ? 15 : 999999,
                smsQuota: plan === 'business' ? 200 : plan === 'growth' ? 50 : 0,
                updatedAt: new Date(),
              })
              .where(eq(tenants.id, tenantId));
          } else if (status === 'past_due' || status === 'unpaid') {
            // Keep plan but flag the issue — don't downgrade immediately
            await db
              .update(tenants)
              .set({ updatedAt: new Date() })
              .where(eq(tenants.id, tenantId));
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata?.tenantId;

        if (tenantId) {
          // Downgrade to starter
          await db
            .update(tenants)
            .set({
              plan: 'starter',
              stripeSubscriptionId: null,
              planEndsAt: new Date(),
              bookingsQuota: 15,
              smsQuota: 0,
              updatedAt: new Date(),
            })
            .where(eq(tenants.id, tenantId));
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find tenant by Stripe customer ID
        const [tenant] = await db
          .select({ id: tenants.id })
          .from(tenants)
          .where(eq(tenants.stripeCustomerId, customerId))
          .limit(1);

        if (tenant) {
          // TODO: Send email notification about failed payment
          console.warn(`[Stripe Webhook] Payment failed for tenant ${tenant.id}`);
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.bookingId;
        const type = paymentIntent.metadata?.type as 'deposit' | 'full';

        if (bookingId) {
          // Update payment intent record
          await db
            .update(paymentIntents)
            .set({
              status: 'succeeded',
              updatedAt: new Date(),
            })
            .where(eq(paymentIntents.stripePaymentIntentId, paymentIntent.id));

          // Update booking status
          await db
            .update(bookings)
            .set({
              status: 'confirmed',
              paymentStatus: type === 'deposit' ? 'deposit' : 'paid',
              updatedAt: new Date(),
            })
            .where(eq(bookings.id, bookingId));

          console.log(`[Stripe Webhook] Payment succeeded for booking ${bookingId}`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.bookingId;

        if (bookingId) {
          await db
            .update(paymentIntents)
            .set({
              status: 'failed',
              updatedAt: new Date(),
            })
            .where(eq(paymentIntents.stripePaymentIntentId, paymentIntent.id));

          console.warn(`[Stripe Webhook] Payment failed for booking ${bookingId}`);
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }
  } catch (error) {
    console.error('[Stripe Webhook] Error handling event:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}