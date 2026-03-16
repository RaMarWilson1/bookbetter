// src/lib/notifications.ts
import { sendEmail } from '@/lib/email';
import {
  bookingConfirmationClient,
  bookingConfirmationPro,
  reminderClient,
  cancellationClient,
  cancellationPro,
  rescheduleProposalClient,
  rescheduleAcceptedPro,
  rescheduleDeclinedPro,
  reviewRequestClient,
} from '@/lib/email-templates';
import { db } from '@/db';
import { tenants, services, staffAccounts, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Resolve booking context needed for email templates.
 * Fetches tenant, service, and pro email in one go.
 */
async function resolveBookingContext(tenantId: string, serviceId: string) {
  const [tenant] = await db
    .select({
      name: tenants.name,
      slug: tenants.slug,
      timeZone: tenants.timeZone,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  const [service] = await db
    .select({
      name: services.name,
      durationMinutes: services.durationMinutes,
    })
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);

  // Get the owner's email (for pro notifications)
  const [owner] = await db
    .select({
      userId: staffAccounts.userId,
    })
    .from(staffAccounts)
    .where(eq(staffAccounts.tenantId, tenantId))
    .limit(1);

  let ownerEmail: string | null = null;
  if (owner) {
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, owner.userId))
      .limit(1);
    ownerEmail = user?.email || null;
  }

  return {
    businessName: tenant?.name || 'Your provider',
    slug: tenant?.slug || '',
    timeZone: tenant?.timeZone || 'America/New_York',
    serviceName: service?.name || 'Appointment',
    duration: service?.durationMinutes || 60,
    ownerEmail,
    ownerUserId: owner?.userId || null,
  };
}

// ─── Booking Confirmation ─────────────────────────────────────────────

interface BookingData {
  bookingId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  tenantId: string;
  serviceId: string;
  startUtc: Date;
}

export async function notifyBookingConfirmation(booking: BookingData) {
  const ctx = await resolveBookingContext(booking.tenantId, booking.serviceId);

  const details = {
    clientName: booking.clientName,
    serviceName: ctx.serviceName,
    businessName: ctx.businessName,
    date: booking.startUtc,
    timeZone: ctx.timeZone,
    duration: ctx.duration,
    bookingId: booking.bookingId,
    slug: ctx.slug,
  };

  // Email to client
  const clientEmail = bookingConfirmationClient(details);
  await sendEmail({
    to: booking.clientEmail,
    subject: clientEmail.subject,
    html: clientEmail.html,
    userId: booking.clientId,
    bookingId: booking.bookingId,
    purpose: 'booking_confirmation_client',
  });

  // Email to pro
  if (ctx.ownerEmail && ctx.ownerUserId) {
    const proEmail = bookingConfirmationPro(details);
    await sendEmail({
      to: ctx.ownerEmail,
      subject: proEmail.subject,
      html: proEmail.html,
      userId: ctx.ownerUserId,
      bookingId: booking.bookingId,
      purpose: 'booking_confirmation_pro',
    });
  }
}

// ─── Cancellation ─────────────────────────────────────────────────────

export async function notifyCancellation(
  booking: BookingData & { reason?: string },
  cancelledBy: 'client' | 'pro'
) {
  const ctx = await resolveBookingContext(booking.tenantId, booking.serviceId);

  const details = {
    clientName: booking.clientName,
    serviceName: ctx.serviceName,
    businessName: ctx.businessName,
    date: booking.startUtc,
    timeZone: ctx.timeZone,
    duration: ctx.duration,
    bookingId: booking.bookingId,
    slug: ctx.slug,
    reason: booking.reason,
  };

  // Always notify the other party
  if (cancelledBy === 'client' && ctx.ownerEmail && ctx.ownerUserId) {
    const proEmail = cancellationPro(details);
    await sendEmail({
      to: ctx.ownerEmail,
      subject: proEmail.subject,
      html: proEmail.html,
      userId: ctx.ownerUserId,
      bookingId: booking.bookingId,
      purpose: 'cancellation_pro',
    });
  }

  if (cancelledBy === 'pro') {
    const clientEmailContent = cancellationClient(details);
    await sendEmail({
      to: booking.clientEmail,
      subject: clientEmailContent.subject,
      html: clientEmailContent.html,
      userId: booking.clientId,
      bookingId: booking.bookingId,
      purpose: 'cancellation_client',
    });
  }

  // Also send confirmation to the canceller
  if (cancelledBy === 'client') {
    const clientEmailContent = cancellationClient(details);
    await sendEmail({
      to: booking.clientEmail,
      subject: clientEmailContent.subject,
      html: clientEmailContent.html,
      userId: booking.clientId,
      bookingId: booking.bookingId,
      purpose: 'cancellation_client',
    });
  }

  if (cancelledBy === 'pro' && ctx.ownerEmail && ctx.ownerUserId) {
    const proEmail = cancellationPro(details);
    await sendEmail({
      to: ctx.ownerEmail,
      subject: proEmail.subject,
      html: proEmail.html,
      userId: ctx.ownerUserId,
      bookingId: booking.bookingId,
      purpose: 'cancellation_pro',
    });
  }
}

// ─── Reschedule Proposal ──────────────────────────────────────────────

export async function notifyRescheduleProposal(
  booking: BookingData & { proposedStartUtc: Date; rescheduleNote?: string }
) {
  const ctx = await resolveBookingContext(booking.tenantId, booking.serviceId);

  const email = rescheduleProposalClient({
    clientName: booking.clientName,
    serviceName: ctx.serviceName,
    businessName: ctx.businessName,
    date: booking.startUtc,
    timeZone: ctx.timeZone,
    duration: ctx.duration,
    bookingId: booking.bookingId,
    slug: ctx.slug,
    proposedDate: booking.proposedStartUtc,
    note: booking.rescheduleNote,
  });

  await sendEmail({
    to: booking.clientEmail,
    subject: email.subject,
    html: email.html,
    userId: booking.clientId,
    bookingId: booking.bookingId,
    purpose: 'reschedule_proposal_client',
  });
}

// ─── Reschedule Accepted ──────────────────────────────────────────────

export async function notifyRescheduleAccepted(
  booking: BookingData & { newStartUtc: Date }
) {
  const ctx = await resolveBookingContext(booking.tenantId, booking.serviceId);

  if (ctx.ownerEmail && ctx.ownerUserId) {
    const email = rescheduleAcceptedPro({
      clientName: booking.clientName,
      serviceName: ctx.serviceName,
      businessName: ctx.businessName,
      date: booking.startUtc,
      timeZone: ctx.timeZone,
      duration: ctx.duration,
      bookingId: booking.bookingId,
      slug: ctx.slug,
      newDate: booking.newStartUtc,
    });

    await sendEmail({
      to: ctx.ownerEmail,
      subject: email.subject,
      html: email.html,
      userId: ctx.ownerUserId,
      bookingId: booking.bookingId,
      purpose: 'reschedule_accepted_pro',
    });
  }
}

// ─── Reschedule Declined ──────────────────────────────────────────────

export async function notifyRescheduleDeclined(booking: BookingData) {
  const ctx = await resolveBookingContext(booking.tenantId, booking.serviceId);

  if (ctx.ownerEmail && ctx.ownerUserId) {
    const email = rescheduleDeclinedPro({
      clientName: booking.clientName,
      serviceName: ctx.serviceName,
      businessName: ctx.businessName,
      date: booking.startUtc,
      timeZone: ctx.timeZone,
      duration: ctx.duration,
      bookingId: booking.bookingId,
      slug: ctx.slug,
    });

    await sendEmail({
      to: ctx.ownerEmail,
      subject: email.subject,
      html: email.html,
      userId: ctx.ownerUserId,
      bookingId: booking.bookingId,
      purpose: 'reschedule_declined_pro',
    });
  }
}

// ─── 24h Reminder (called by cron) ───────────────────────────────────

export async function notifyReminder24h(booking: BookingData) {
  const ctx = await resolveBookingContext(booking.tenantId, booking.serviceId);

  const email = reminderClient({
    clientName: booking.clientName,
    serviceName: ctx.serviceName,
    businessName: ctx.businessName,
    date: booking.startUtc,
    timeZone: ctx.timeZone,
    duration: ctx.duration,
    bookingId: booking.bookingId,
    slug: ctx.slug,
  });

  await sendEmail({
    to: booking.clientEmail,
    subject: email.subject,
    html: email.html,
    userId: booking.clientId,
    bookingId: booking.bookingId,
    purpose: 'reminder_24h',
  });
}

// ─── Review Request (called by cron) ─────────────────────────────────

export async function notifyReviewRequest(booking: BookingData) {
  const ctx = await resolveBookingContext(booking.tenantId, booking.serviceId);

  const email = reviewRequestClient({
    clientName: booking.clientName,
    serviceName: ctx.serviceName,
    businessName: ctx.businessName,
    date: booking.startUtc,
    timeZone: ctx.timeZone,
    duration: ctx.duration,
    bookingId: booking.bookingId,
    slug: ctx.slug,
  });

  await sendEmail({
    to: booking.clientEmail,
    subject: email.subject,
    html: email.html,
    userId: booking.clientId,
    bookingId: booking.bookingId,
    purpose: 'review_request',
  });
}