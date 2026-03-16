// src/app/api/dashboard/appointments/[id]/request-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { bookings, tenants, services, staffAccounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';
import { sendEmail } from '@/lib/email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://thebookbetter.com';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { amountCents: customAmount } = body; // optional override

    // Get booking with service and tenant
    const [booking] = await db
      .select({
        id: bookings.id,
        tenantId: bookings.tenantId,
        clientId: bookings.clientId,
        clientName: bookings.clientName,
        clientEmail: bookings.clientEmail,
        paymentStatus: bookings.paymentStatus,
        serviceId: bookings.serviceId,
        status: bookings.status,
        serviceName: services.name,
        priceCents: services.priceCents,
        tenantName: tenants.name,
        stripeAccountId: tenants.stripeAccountId,
        stripeOnboardingComplete: tenants.stripeOnboardingComplete,
      })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .innerJoin(tenants, eq(bookings.tenantId, tenants.id))
      .where(eq(bookings.id, id))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify the pro owns this booking's tenant
    const [staff] = await db
      .select({ tenantId: staffAccounts.tenantId })
      .from(staffAccounts)
      .where(
        and(
          eq(staffAccounts.userId, session.user.id),
          eq(staffAccounts.tenantId, booking.tenantId)
        )
      )
      .limit(1);

    if (!staff) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (!booking.clientEmail) {
      return NextResponse.json({ error: 'No client email on this booking' }, { status: 400 });
    }

    if (booking.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'This booking is already paid' }, { status: 400 });
    }

    // Determine amount (custom or service price)
    const amountCents = customAmount || booking.priceCents;

    if (!amountCents || amountCents <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
    }

    const lineItems = [
      {
        price_data: {
          currency: 'usd' as const,
          product_data: {
            name: booking.serviceName || 'Service',
            description: `Payment for ${booking.serviceName} with ${booking.tenantName}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ];

    const metadata = {
      bookingId: booking.id,
      tenantId: booking.tenantId,
      type: 'full',
    };

    // Block if pro hasn't connected Stripe — we don't accept payments on their behalf
    if (!booking.stripeAccountId || !booking.stripeOnboardingComplete) {
      return NextResponse.json(
        { error: 'Connect Stripe first to send payment requests. Go to Settings → Payments to set up Stripe.' },
        { status: 400 }
      );
    }

    const successUrl = `${APP_URL}/my-bookings?payment=success`;
    const cancelUrl = `${APP_URL}/my-bookings?payment=cancelled`;

    const checkoutSession = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: lineItems,
        customer_email: booking.clientEmail,
        metadata,
        success_url: successUrl,
        cancel_url: cancelUrl,
        payment_intent_data: { metadata },
      },
      { stripeAccount: booking.stripeAccountId }
    );

    const paymentLink = checkoutSession.url;

    // Send payment request email to client
    const amountFormatted = `$${(amountCents / 100).toFixed(2)}`;
    sendEmail({
      to: booking.clientEmail,
      subject: `Payment request from ${booking.tenantName} — ${amountFormatted}`,
      html: paymentRequestEmailHtml({
        clientName: booking.clientName || 'there',
        businessName: booking.tenantName || 'Your provider',
        serviceName: booking.serviceName || 'your service',
        amount: amountFormatted,
        paymentLink: paymentLink!,
      }),
      userId: booking.clientId,
      bookingId: booking.id,
      purpose: 'payment_request',
    }).catch((err) => console.error('[PaymentRequest] Email error:', err));

    // Update booking to indicate payment was requested
    await db
      .update(bookings)
      .set({ updatedAt: new Date() })
      .where(eq(bookings.id, id));

    return NextResponse.json({
      success: true,
      paymentLink,
      amountCents,
    });
  } catch (error) {
    console.error('[PaymentRequest] Error:', error);
    return NextResponse.json({ error: 'Failed to create payment request' }, { status: 500 });
  }
}

function paymentRequestEmailHtml(details: {
  clientName: string;
  businessName: string;
  serviceName: string;
  amount: string;
  paymentLink: string;
}) {
  const { clientName, businessName, serviceName, amount, paymentLink } = details;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f7f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${businessName} is requesting ${amount} for ${serviceName}.</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#0f172a;padding:24px 32px;">
              <span style="font-size:18px;font-weight:700;color:#ffffff;">Book<span style="color:#60a5fa;">Better</span></span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Payment request</h1>
              <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.5;">
                Hi ${clientName}, <strong>${businessName}</strong> is requesting payment for your recent ${serviceName}.
              </p>
              <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:0 0 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:13px;color:#64748b;padding:4px 0;">Service</td>
                    <td align="right" style="font-size:13px;font-weight:600;color:#0f172a;padding:4px 0;">${serviceName}</td>
                  </tr>
                  <tr>
                    <td style="font-size:13px;color:#64748b;padding:4px 0;">Amount due</td>
                    <td align="right" style="font-size:18px;font-weight:700;color:#0f172a;padding:4px 0;">${amount}</td>
                  </tr>
                </table>
              </div>
              <a href="${paymentLink}" style="display:block;text-align:center;background:#2563eb;color:#ffffff;padding:14px 24px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;">Pay Now</a>
              <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;text-align:center;">
                Secure payment powered by Stripe
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}