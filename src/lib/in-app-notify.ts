// src/lib/in-app-notify.ts
import { db } from '@/db';
import { inAppNotifications } from '@/db/schema';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  category: 'booking' | 'cancellation' | 'reschedule' | 'review' | 'payment';
  linkUrl?: string;
}

export async function createInAppNotification({
  userId,
  title,
  message,
  category,
  linkUrl,
}: CreateNotificationParams) {
  try {
    await db.insert(inAppNotifications).values({
      userId,
      title,
      message,
      category,
      linkUrl: linkUrl || null,
    });
  } catch (err) {
    console.error('[InAppNotify] Failed to create notification:', err);
  }
}

// ─── Convenience functions for each event ─────────────────────

export async function notifyInAppNewBooking(
  proUserId: string,
  clientName: string,
  serviceName: string
) {
  await createInAppNotification({
    userId: proUserId,
    title: 'New booking',
    message: `${clientName} booked ${serviceName}`,
    category: 'booking',
    linkUrl: '/dashboard/appointments',
  });
}

export async function notifyInAppCancellation(
  userId: string,
  otherPartyName: string,
  serviceName: string,
  isPro: boolean
) {
  await createInAppNotification({
    userId,
    title: 'Booking cancelled',
    message: `${otherPartyName} cancelled ${serviceName}`,
    category: 'cancellation',
    linkUrl: isPro ? '/dashboard/appointments' : '/my-bookings',
  });
}

export async function notifyInAppRescheduleProposal(
  clientUserId: string,
  businessName: string,
  serviceName: string
) {
  await createInAppNotification({
    userId: clientUserId,
    title: 'Reschedule request',
    message: `${businessName} wants to reschedule your ${serviceName}`,
    category: 'reschedule',
    linkUrl: '/my-bookings',
  });
}

export async function notifyInAppRescheduleResponse(
  proUserId: string,
  clientName: string,
  accepted: boolean
) {
  await createInAppNotification({
    userId: proUserId,
    title: accepted ? 'Reschedule accepted' : 'Reschedule declined',
    message: `${clientName} ${accepted ? 'accepted' : 'declined'} the new time`,
    category: 'reschedule',
    linkUrl: '/dashboard/appointments',
  });
}

export async function notifyInAppReviewReceived(
  proUserId: string,
  clientName: string,
  rating: number
) {
  await createInAppNotification({
    userId: proUserId,
    title: 'New review',
    message: `${clientName} left a ${rating}-star review`,
    category: 'review',
    linkUrl: '/dashboard/reviews',
  });
}

export async function notifyInAppPaymentReceived(
  proUserId: string,
  clientName: string,
  amountCents: number
) {
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountCents / 100);

  await createInAppNotification({
    userId: proUserId,
    title: 'Payment received',
    message: `${clientName} paid ${amount}`,
    category: 'payment',
    linkUrl: '/dashboard/appointments',
  });
}