// src/lib/notification-prefs.ts
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface NotificationPrefs {
  notifyEmailBooking: boolean;
  notifyEmailCancellation: boolean;
  notifyEmailReschedule: boolean;
  notifyEmailReminder: boolean;
  notifyEmailReviewRequest: boolean;
  notifySmsBooking: boolean;
  notifySmsCancellation: boolean;
  notifySmsReschedule: boolean;
  notifySmsReminder: boolean;
  notifyInAppBooking: boolean;
  notifyInAppCancellation: boolean;
  notifyInAppReschedule: boolean;
  notifyInAppReview: boolean;
  notifyInAppPayment: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  notifyEmailBooking: true,
  notifyEmailCancellation: true,
  notifyEmailReschedule: true,
  notifyEmailReminder: true,
  notifyEmailReviewRequest: true,
  notifySmsBooking: true,
  notifySmsCancellation: true,
  notifySmsReschedule: true,
  notifySmsReminder: true,
  notifyInAppBooking: true,
  notifyInAppCancellation: true,
  notifyInAppReschedule: true,
  notifyInAppReview: true,
  notifyInAppPayment: true,
};

/**
 * Fetch notification preferences for a tenant.
 * Returns all-true defaults if tenant not found (safe fallback).
 */
export async function getNotificationPrefs(tenantId: string): Promise<NotificationPrefs> {
  try {
    const [tenant] = await db
      .select({
        notifyEmailBooking: tenants.notifyEmailBooking,
        notifyEmailCancellation: tenants.notifyEmailCancellation,
        notifyEmailReschedule: tenants.notifyEmailReschedule,
        notifyEmailReminder: tenants.notifyEmailReminder,
        notifyEmailReviewRequest: tenants.notifyEmailReviewRequest,
        notifySmsBooking: tenants.notifySmsBooking,
        notifySmsCancellation: tenants.notifySmsCancellation,
        notifySmsReschedule: tenants.notifySmsReschedule,
        notifySmsReminder: tenants.notifySmsReminder,
        notifyInAppBooking: tenants.notifyInAppBooking,
        notifyInAppCancellation: tenants.notifyInAppCancellation,
        notifyInAppReschedule: tenants.notifyInAppReschedule,
        notifyInAppReview: tenants.notifyInAppReview,
        notifyInAppPayment: tenants.notifyInAppPayment,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    return tenant || DEFAULT_PREFS;
  } catch (err) {
    console.error('[NotifPrefs] Failed to fetch:', err);
    return DEFAULT_PREFS;
  }
}