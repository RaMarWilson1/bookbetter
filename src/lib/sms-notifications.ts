// src/lib/sms-notifications.ts
import { sendSms } from '@/lib/sms';
import { db } from '@/db';
import { tenants, services, staffAccounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Resolve booking context for SMS templates
 */
async function resolveSmsContext(tenantId: string, serviceId: string) {
  const [tenant] = await db
    .select({
      name: tenants.name,
      timeZone: tenants.timeZone,
      slug: tenants.slug,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  const [service] = await db
    .select({ name: services.name, durationMinutes: services.durationMinutes })
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);

  const [owner] = await db
    .select({ userId: staffAccounts.userId })
    .from(staffAccounts)
    .where(and(eq(staffAccounts.tenantId, tenantId), eq(staffAccounts.role, 'owner')))
    .limit(1);

  // Use the tenant's phone for pro SMS (since users table has no phone)
  const [tenantPhone] = await db
    .select({ phone: tenants.phone })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  return {
    businessName: tenant?.name || 'Your provider',
    timeZone: tenant?.timeZone || 'America/New_York',
    slug: tenant?.slug || '',
    serviceName: service?.name || 'your appointment',
    durationMinutes: service?.durationMinutes || 0,
    ownerUserId: owner?.userId || null,
    ownerPhone: tenantPhone?.phone || null,
  };
}

function formatDateTime(dateStr: string | Date, timeZone: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// ─── Client SMS: Booking Confirmation ───────────────────────

interface BookingSmsParams {
  clientPhone: string;
  clientName: string;
  tenantId: string;
  serviceId: string;
  bookingId: string;
  clientId: string;
  startUtc: Date;
}

export async function smsBookingConfirmationClient(params: BookingSmsParams) {
  const ctx = await resolveSmsContext(params.tenantId, params.serviceId);
  const when = formatDateTime(params.startUtc, ctx.timeZone);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thebookbetter.com';

  const body = `Confirmed! Your ${ctx.serviceName} with ${ctx.businessName} is set for ${when}. Manage: ${appUrl}/my-bookings`;

  await sendSms({
    to: params.clientPhone,
    body,
    tenantId: params.tenantId,
    bookingId: params.bookingId,
    userId: params.clientId,
    purpose: 'booking_confirmation',
  });
}

// ─── Pro SMS: New Booking ───────────────────────────────────

export async function smsNewBookingPro(params: BookingSmsParams) {
  const ctx = await resolveSmsContext(params.tenantId, params.serviceId);
  if (!ctx.ownerPhone || !ctx.ownerUserId) return;

  const when = formatDateTime(params.startUtc, ctx.timeZone);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thebookbetter.com';

  const body = `New booking! ${params.clientName} booked ${ctx.serviceName} for ${when}. View: ${appUrl}/dashboard/appointments`;

  await sendSms({
    to: ctx.ownerPhone,
    body,
    tenantId: params.tenantId,
    bookingId: params.bookingId,
    userId: ctx.ownerUserId,
    purpose: 'new_booking_pro',
  });
}

// ─── Client SMS: 24h Reminder ───────────────────────────────

export async function smsReminderClient(params: {
  clientPhone: string;
  clientId: string;
  tenantId: string;
  serviceId: string;
  bookingId: string;
  startUtc: Date;
}) {
  const ctx = await resolveSmsContext(params.tenantId, params.serviceId);
  const when = formatDateTime(params.startUtc, ctx.timeZone);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thebookbetter.com';

  const body = `Reminder: Your ${ctx.serviceName} with ${ctx.businessName} is tomorrow at ${when}. Manage: ${appUrl}/my-bookings`;

  await sendSms({
    to: params.clientPhone,
    body,
    tenantId: params.tenantId,
    bookingId: params.bookingId,
    userId: params.clientId,
    purpose: 'reminder_24h',
  });
}

// ─── Client SMS: Cancellation ───────────────────────────────

export async function smsCancellationClient(params: {
  clientPhone: string;
  clientId: string;
  tenantId: string;
  serviceId: string;
  bookingId: string;
  startUtc: Date;
  cancelledBy: 'client' | 'pro';
}) {
  const ctx = await resolveSmsContext(params.tenantId, params.serviceId);
  const when = formatDateTime(params.startUtc, ctx.timeZone);

  const body = params.cancelledBy === 'pro'
    ? `${ctx.businessName} has cancelled your ${ctx.serviceName} scheduled for ${when}. We apologize for any inconvenience.`
    : `Your ${ctx.serviceName} with ${ctx.businessName} on ${when} has been cancelled.`;

  await sendSms({
    to: params.clientPhone,
    body,
    tenantId: params.tenantId,
    bookingId: params.bookingId,
    userId: params.clientId,
    purpose: 'cancellation',
  });
}

// ─── Pro SMS: Client Cancelled ──────────────────────────────

export async function smsCancellationPro(params: {
  clientName: string;
  tenantId: string;
  serviceId: string;
  bookingId: string;
  startUtc: Date;
}) {
  const ctx = await resolveSmsContext(params.tenantId, params.serviceId);
  if (!ctx.ownerPhone || !ctx.ownerUserId) return;

  const when = formatDateTime(params.startUtc, ctx.timeZone);

  const body = `${params.clientName} cancelled their ${ctx.serviceName} on ${when}.`;

  await sendSms({
    to: ctx.ownerPhone,
    body,
    tenantId: params.tenantId,
    bookingId: params.bookingId,
    userId: ctx.ownerUserId,
    purpose: 'cancellation_pro',
  });
}

// ─── Client SMS: Reschedule Proposal ────────────────────────

export async function smsRescheduleProposalClient(params: {
  clientPhone: string;
  clientId: string;
  tenantId: string;
  serviceId: string;
  bookingId: string;
  proposedStartUtc: Date;
}) {
  const ctx = await resolveSmsContext(params.tenantId, params.serviceId);
  const newWhen = formatDateTime(params.proposedStartUtc, ctx.timeZone);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thebookbetter.com';

  const body = `${ctx.businessName} would like to reschedule your ${ctx.serviceName} to ${newWhen}. Accept or decline: ${appUrl}/my-bookings`;

  await sendSms({
    to: params.clientPhone,
    body,
    tenantId: params.tenantId,
    bookingId: params.bookingId,
    userId: params.clientId,
    purpose: 'reschedule_proposal',
  });
}