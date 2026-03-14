// src/app/my-bookings/[id]/review/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { bookings, services, tenants, reviews } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { ReviewForm } from './_components/review-form';

export const dynamic = 'force-dynamic';

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/sign-in?callbackUrl=/my-bookings');
  }

  const { id: bookingId } = await params;

  // Fetch booking with service and tenant info
  const [booking] = await db
    .select({
      id: bookings.id,
      clientId: bookings.clientId,
      startUtc: bookings.startUtc,
      status: bookings.status,
      serviceName: services.name,
      servicePriceCents: services.priceCents,
      serviceDurationMinutes: services.durationMinutes,
      tenantName: tenants.name,
      tenantSlug: tenants.slug,
      tenantLogo: tenants.logo,
      tenantPrimaryColor: tenants.primaryColor,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(tenants, eq(bookings.tenantId, tenants.id))
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.clientId, session.user.id)
      )
    )
    .limit(1);

  if (!booking) {
    redirect('/my-bookings');
  }

  // Check if already reviewed
  const [existingReview] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(eq(reviews.bookingId, bookingId))
    .limit(1);

  if (existingReview) {
    redirect('/my-bookings');
  }

  // Must be past
  if (new Date(booking.startUtc) > new Date()) {
    redirect('/my-bookings');
  }

  if (booking.status === 'cancelled') {
    redirect('/my-bookings');
  }

  return (
    <ReviewForm
      booking={{
        id: booking.id,
        startUtc: booking.startUtc.toISOString(),
        serviceName: booking.serviceName,
        servicePriceCents: booking.servicePriceCents,
        serviceDurationMinutes: booking.serviceDurationMinutes,
        tenantName: booking.tenantName,
        tenantSlug: booking.tenantSlug,
        tenantLogo: booking.tenantLogo,
        tenantPrimaryColor: booking.tenantPrimaryColor,
      }}
    />
  );
}