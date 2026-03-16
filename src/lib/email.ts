// src/lib/email.ts
import { Resend } from 'resend';
import { db } from '@/db';
import { notifications } from '@/db/schema';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'notifications@thebookbetter.com';
const FROM_NAME = 'BookBetter';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  /** For notification logging */
  userId: string;
  bookingId?: string;
  purpose: string;
}

export async function sendEmail({ to, subject, html, userId, bookingId, purpose }: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    // Log to notifications table
    await db.insert(notifications).values({
      userId,
      bookingId: bookingId || null,
      type: 'email',
      purpose,
      recipient: to,
      status: error ? 'failed' : 'sent',
      externalId: data?.id || null,
      errorMessage: error?.message || null,
    });

    if (error) {
      console.error(`[Email] Failed to send ${purpose} to ${to}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Sent ${purpose} to ${to} (id: ${data?.id})`);
    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Email] Exception sending ${purpose} to ${to}:`, message);

    // Still log the failure
    try {
      await db.insert(notifications).values({
        userId,
        bookingId: bookingId || null,
        type: 'email',
        purpose,
        recipient: to,
        status: 'failed',
        externalId: null,
        errorMessage: message,
      });
    } catch {
      // Don't let logging failure crash the flow
    }

    return { success: false, error: message };
  }
}