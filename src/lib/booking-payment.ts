// src/lib/booking-payment.ts
//
// Creates Stripe PaymentIntents using destination charges.
// 100% of the payment goes to the staff member's connected Stripe account.
// BookBetter does not take any platform fees on payments.

import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import {
  bookings,
  services,
  tenants,
  staffAccounts,
  paymentIntents,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';

interface CreatePaymentResult {
  clientSecret: string;
  paymentIntentId: string;
  amountCents: number;
  connectedAccountId: string;
}

/**
 * Determine the payment amount for a booking.
 * If the service has a deposit and the tenant supports deposits → charge deposit.
 * If fullPayRequired → charge full price.
 * Otherwise → charge full price.
 */
export function getPaymentAmount(service: {
  priceCents: number;
  depositCents: number | null;
  fullPayRequired: boolean;
}): { amountCents: number; type: 'deposit' | 'full' } {
  if (
    service.depositCents &&
    service.depositCents > 0 &&
    !service.fullPayRequired
  ) {
    return { amountCents: service.depositCents, type: 'deposit' };
  }
  return { amountCents: service.priceCents, type: 'full' };
}

/**
 * Check if a booking requires payment.
 * - Tenant must be on Growth or Business plan (deposits feature)
 * - The assigned staff (or owner) must have a connected Stripe account
 * - Service must have a price > 0
 */
export async function bookingRequiresPayment(
  bookingId: string
): Promise<{
  required: boolean;
  amountCents: number;
  type: 'deposit' | 'full';
  connectedAccountId: string | null;
  bookingData: {
    tenantId: string;
    serviceId: string;
    staffId: string | null;
    clientEmail: string | null;
    clientName: string | null;
  } | null;
}> {
  const noPayment = {
    required: false,
    amountCents: 0,
    type: 'full' as const,
    connectedAccountId: null,
    bookingData: null,
  };

  // Get booking with service and tenant
  const [booking] = await db
    .select({
      tenantId: bookings.tenantId,
      serviceId: bookings.serviceId,
      staffId: bookings.staffId,
      clientEmail: bookings.clientEmail,
      clientName: bookings.clientName,
      priceCents: services.priceCents,
      depositCents: services.depositCents,
      fullPayRequired: services.fullPayRequired,
      tenantPlan: tenants.plan,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(tenants, eq(bookings.tenantId, tenants.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) return noPayment;

  // No charge for free services
  if (booking.priceCents === 0) return noPayment;

  // Find the connected Stripe account for the staff member or owner
  const staffFilter = booking.staffId
    ? and(
        eq(staffAccounts.tenantId, booking.tenantId),
        eq(staffAccounts.userId, booking.staffId),
        eq(staffAccounts.active, true)
      )
    : and(
        eq(staffAccounts.tenantId, booking.tenantId),
        eq(staffAccounts.role, 'owner'),
        eq(staffAccounts.active, true)
      );

  const [staff] = await db
    .select({
      stripeAccountId: staffAccounts.stripeAccountId,
      stripeOnboardingComplete: staffAccounts.stripeOnboardingComplete,
    })
    .from(staffAccounts)
    .where(staffFilter)
    .limit(1);

  // No connected account → no payment collection
  if (!staff?.stripeAccountId || !staff.stripeOnboardingComplete) {
    return noPayment;
  }

  const { amountCents, type } = getPaymentAmount({
    priceCents: booking.priceCents,
    depositCents: booking.depositCents,
    fullPayRequired: booking.fullPayRequired,
  });

  return {
    required: true,
    amountCents,
    type,
    connectedAccountId: staff.stripeAccountId,
    bookingData: {
      tenantId: booking.tenantId,
      serviceId: booking.serviceId,
      staffId: booking.staffId,
      clientEmail: booking.clientEmail,
      clientName: booking.clientName,
    },
  };
}

/**
 * Create a Stripe PaymentIntent with a destination charge.
 * 100% goes to the connected account — no platform fees.
 */
export async function createBookingPaymentIntent(
  bookingId: string
): Promise<CreatePaymentResult | null> {
  const paymentInfo = await bookingRequiresPayment(bookingId);

  if (!paymentInfo.required || !paymentInfo.connectedAccountId) {
    return null;
  }

  // Create PaymentIntent with destination charge — no platform fees
  const paymentIntent = await stripe.paymentIntents.create({
    amount: paymentInfo.amountCents,
    currency: 'usd',
    transfer_data: {
      destination: paymentInfo.connectedAccountId,
    },
    metadata: {
      bookingId,
      tenantId: paymentInfo.bookingData?.tenantId || '',
      type: paymentInfo.type,
    },
    receipt_email: paymentInfo.bookingData?.clientEmail || undefined,
    description: `Booking ${bookingId.slice(0, 8)} — ${paymentInfo.type === 'deposit' ? 'Deposit' : 'Full payment'}`,
  });

  // Save payment intent to DB
  await db.insert(paymentIntents).values({
    bookingId,
    stripePaymentIntentId: paymentIntent.id,
    amountCents: paymentInfo.amountCents,
    type: paymentInfo.type,
    status: paymentIntent.status,
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
    amountCents: paymentInfo.amountCents,
    connectedAccountId: paymentInfo.connectedAccountId,
  };
}

/**
 * Confirm that a payment was successful and update booking status.
 */
export async function confirmBookingPayment(
  paymentIntentId: string
): Promise<boolean> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return false;
    }

    const bookingId = paymentIntent.metadata.bookingId;
    const type = paymentIntent.metadata.type as 'deposit' | 'full';

    if (!bookingId) return false;

    // Update payment intent record
    await db
      .update(paymentIntents)
      .set({
        status: paymentIntent.status,
        receiptUrl: paymentIntent.latest_charge
          ? (typeof paymentIntent.latest_charge === 'string'
              ? undefined
              : (paymentIntent.latest_charge as { receipt_url?: string })?.receipt_url) || undefined
          : undefined,
        updatedAt: new Date(),
      })
      .where(eq(paymentIntents.stripePaymentIntentId, paymentIntentId));

    // Update booking status
    await db
      .update(bookings)
      .set({
        status: 'confirmed',
        paymentStatus: type === 'deposit' ? 'deposit' : 'paid',
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));

    return true;
  } catch (error) {
    console.error('[Payment Confirm] Error:', error);
    return false;
  }
}