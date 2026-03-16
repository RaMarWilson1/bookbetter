// src/lib/email-templates.ts

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://thebookbetter.com';

/** Shared wrapper for all emails */
function layout(content: string, preheader?: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BookBetter</title>
</head>
<body style="margin:0;padding:0;background:#f7f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:1px solid #f0f0f0;">
              <span style="font-size:18px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;">BookBetter</span>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:28px 32px 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #f0f0f0;background:#fafafa;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
                Sent by BookBetter · <a href="${APP_URL}" style="color:#94a3b8;">thebookbetter.com</a>
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

function button(text: string, href: string) {
  return `<a href="${href}" style="display:inline-block;padding:12px 28px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;margin-top:8px;">${text}</a>`;
}

function detailRow(label: string, value: string) {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:#64748b;width:100px;">${label}</td>
    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:500;">${value}</td>
  </tr>`;
}

function detailsTable(rows: { label: string; value: string }[]) {
  return `<table cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0 20px;background:#f8fafc;border-radius:8px;padding:16px;">
    ${rows.map(r => detailRow(r.label, r.value)).join('')}
  </table>`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(date: Date, timeZone: string) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  });
}

// ─── Templates ────────────────────────────────────────────────────────────

interface BookingDetails {
  clientName: string;
  serviceName: string;
  businessName: string;
  date: Date;
  timeZone: string;
  duration: number; // minutes
  bookingId: string;
  slug: string;
}

/**
 * 1. Booking Confirmation → Client
 */
export function bookingConfirmationClient(details: BookingDetails) {
  const { clientName, serviceName, businessName, date, timeZone, duration, slug } = details;

  return {
    subject: `Booking confirmed with ${businessName}`,
    html: layout(`
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">You're booked!</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.5;">
        Hi ${clientName}, your appointment with ${businessName} has been confirmed.
      </p>
      ${detailsTable([
        { label: 'Service', value: serviceName },
        { label: 'Date', value: formatDate(date) },
        { label: 'Time', value: formatTime(date, timeZone) },
        { label: 'Duration', value: `${duration} min` },
      ])}
      ${button('View my bookings', `${APP_URL}/my-bookings`)}
      <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">
        Need to cancel? You can manage your booking from the link above.
      </p>
    `, `Your appointment with ${businessName} is confirmed.`),
  };
}

/**
 * 2. Booking Confirmation → Pro
 */
export function bookingConfirmationPro(details: BookingDetails) {
  const { clientName, serviceName, businessName, date, timeZone, duration } = details;

  return {
    subject: `New booking: ${clientName} · ${serviceName}`,
    html: layout(`
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">New booking</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.5;">
        ${clientName} just booked an appointment with ${businessName}.
      </p>
      ${detailsTable([
        { label: 'Client', value: clientName },
        { label: 'Service', value: serviceName },
        { label: 'Date', value: formatDate(date) },
        { label: 'Time', value: formatTime(date, timeZone) },
        { label: 'Duration', value: `${duration} min` },
      ])}
      ${button('View appointments', `${APP_URL}/dashboard/appointments`)}
    `, `${clientName} booked ${serviceName}.`),
  };
}

/**
 * 3. 24h Reminder → Client
 */
export function reminderClient(details: BookingDetails) {
  const { clientName, serviceName, businessName, date, timeZone } = details;

  return {
    subject: `Reminder: ${serviceName} tomorrow with ${businessName}`,
    html: layout(`
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Appointment reminder</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.5;">
        Hi ${clientName}, just a reminder that your appointment is tomorrow.
      </p>
      ${detailsTable([
        { label: 'Service', value: serviceName },
        { label: 'With', value: businessName },
        { label: 'Date', value: formatDate(date) },
        { label: 'Time', value: formatTime(date, timeZone) },
      ])}
      ${button('View my bookings', `${APP_URL}/my-bookings`)}
    `, `Your appointment with ${businessName} is tomorrow.`),
  };
}

/**
 * 4. Cancellation Notice → Client
 */
export function cancellationClient(details: BookingDetails & { reason?: string }) {
  const { clientName, serviceName, businessName, date, timeZone, reason, slug } = details;

  return {
    subject: `Appointment cancelled – ${businessName}`,
    html: layout(`
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Appointment cancelled</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.5;">
        Hi ${clientName}, your appointment with ${businessName} has been cancelled.
      </p>
      ${detailsTable([
        { label: 'Service', value: serviceName },
        { label: 'Date', value: formatDate(date) },
        { label: 'Time', value: formatTime(date, timeZone) },
        ...(reason ? [{ label: 'Reason', value: reason }] : []),
      ])}
      <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.5;">
        You can rebook at any time:
      </p>
      ${button('Book again', `${APP_URL}/book/${slug}`)}
    `, `Your appointment with ${businessName} has been cancelled.`),
  };
}

/**
 * 5. Cancellation Notice → Pro
 */
export function cancellationPro(details: BookingDetails & { reason?: string }) {
  const { clientName, serviceName, date, timeZone, reason } = details;

  return {
    subject: `Cancellation: ${clientName} · ${serviceName}`,
    html: layout(`
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Booking cancelled</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.5;">
        ${clientName} has cancelled their appointment.
      </p>
      ${detailsTable([
        { label: 'Client', value: clientName },
        { label: 'Service', value: serviceName },
        { label: 'Date', value: formatDate(date) },
        { label: 'Time', value: formatTime(date, timeZone) },
        ...(reason ? [{ label: 'Reason', value: reason }] : []),
      ])}
      ${button('View appointments', `${APP_URL}/dashboard/appointments`)}
    `, `${clientName} cancelled ${serviceName}.`),
  };
}

/**
 * 6. Reschedule Proposal → Client
 */
export function rescheduleProposalClient(
  details: BookingDetails & {
    proposedDate: Date;
    note?: string;
  }
) {
  const { clientName, serviceName, businessName, date, timeZone, proposedDate, note } = details;

  return {
    subject: `${businessName} wants to reschedule your appointment`,
    html: layout(`
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Reschedule request</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.5;">
        Hi ${clientName}, ${businessName} would like to reschedule your appointment.
      </p>
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Original time</p>
      ${detailsTable([
        { label: 'Service', value: serviceName },
        { label: 'Date', value: formatDate(date) },
        { label: 'Time', value: formatTime(date, timeZone) },
      ])}
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#3b82f6;text-transform:uppercase;letter-spacing:0.5px;">Proposed new time</p>
      ${detailsTable([
        { label: 'Date', value: formatDate(proposedDate) },
        { label: 'Time', value: formatTime(proposedDate, timeZone) },
        ...(note ? [{ label: 'Note', value: note }] : []),
      ])}
      <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.5;">
        You can accept the new time or choose a different one:
      </p>
      ${button('Review & respond', `${APP_URL}/my-bookings`)}
    `, `${businessName} wants to move your ${serviceName} appointment.`),
  };
}

/**
 * 7. Reschedule Accepted → Pro
 */
export function rescheduleAcceptedPro(details: BookingDetails & { newDate: Date }) {
  const { clientName, serviceName, businessName, newDate, timeZone } = details;

  return {
    subject: `Reschedule accepted: ${clientName} · ${serviceName}`,
    html: layout(`
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Reschedule accepted</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.5;">
        ${clientName} accepted the new time for their ${serviceName} appointment.
      </p>
      ${detailsTable([
        { label: 'Client', value: clientName },
        { label: 'Service', value: serviceName },
        { label: 'New date', value: formatDate(newDate) },
        { label: 'New time', value: formatTime(newDate, timeZone) },
      ])}
      ${button('View appointments', `${APP_URL}/dashboard/appointments`)}
    `, `${clientName} accepted the reschedule.`),
  };
}

/**
 * 8. Reschedule Declined → Pro
 */
export function rescheduleDeclinedPro(details: BookingDetails) {
  const { clientName, serviceName, businessName, date, timeZone } = details;

  return {
    subject: `Reschedule declined: ${clientName} · ${serviceName}`,
    html: layout(`
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Reschedule declined</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.5;">
        ${clientName} declined the proposed new time. The original appointment stays:
      </p>
      ${detailsTable([
        { label: 'Client', value: clientName },
        { label: 'Service', value: serviceName },
        { label: 'Date', value: formatDate(date) },
        { label: 'Time', value: formatTime(date, timeZone) },
      ])}
      ${button('View appointments', `${APP_URL}/dashboard/appointments`)}
    `, `${clientName} declined the reschedule. Original time kept.`),
  };
}

/**
 * 9. Review Request → Client (sent ~2h after appointment ends)
 */
export function reviewRequestClient(details: BookingDetails) {
  const { clientName, serviceName, businessName, slug } = details;

  return {
    subject: `How was your ${serviceName} with ${businessName}?`,
    html: layout(`
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">How was your experience?</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.5;">
        Hi ${clientName}, we hope you enjoyed your ${serviceName} with ${businessName}! Your feedback helps other clients and helps ${businessName} improve.
      </p>
      ${button('Leave a review', `${APP_URL}/my-bookings`)}
      <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">
        It only takes a minute — your review means a lot!
      </p>
    `, `Share your experience with ${businessName}.`),
  };
}