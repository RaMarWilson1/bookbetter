// src/app/book/[slug]/page.tsx
import { db } from '@/db';
import { tenants, services, availabilityTemplates, availabilityExceptions, reviews, bookings } from '@/db/schema';
import { eq, and, avg, count, gte, desc, ne, or, isNull } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { BookingFlow } from './_components/booking-flow';
import type { Metadata } from 'next';

async function getBusinessData(slug: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(and(eq(tenants.slug, slug), eq(tenants.active, true)))
    .limit(1);

  if (!tenant) return null;

  const serviceList = await db
    .select()
    .from(services)
    .where(and(eq(services.tenantId, tenant.id), eq(services.active, true)));

  const templates = await db
    .select()
    .from(availabilityTemplates)
    .where(and(eq(availabilityTemplates.tenantId, tenant.id), eq(availabilityTemplates.active, true)));

  const exceptions = await db
    .select()
    .from(availabilityExceptions)
    .where(
      and(
        eq(availabilityExceptions.tenantId, tenant.id),
        gte(availabilityExceptions.endUtc, new Date())
      )
    );

  // Get review stats (only approved/visible reviews)
  const approvedFilter = or(eq(reviews.approved, true), isNull(reviews.approved));

  const [reviewStats] = await db
    .select({
      avgRating: avg(reviews.rating),
      totalReviews: count(reviews.id),
    })
    .from(reviews)
    .where(and(eq(reviews.tenantId, tenant.id), approvedFilter));

  // Get recent reviews with client names (only approved/visible)
  const recentReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      response: reviews.response,
      createdAt: reviews.createdAt,
      clientName: bookings.clientName,
    })
    .from(reviews)
    .leftJoin(bookings, eq(reviews.bookingId, bookings.id))
    .where(and(eq(reviews.tenantId, tenant.id), approvedFilter))
    .orderBy(desc(reviews.createdAt))
    .limit(10);

  return {
    tenant,
    services: serviceList,
    templates,
    exceptions,
    reviewStats: {
      avgRating: reviewStats?.avgRating ? parseFloat(reviewStats.avgRating) : null,
      totalReviews: reviewStats?.totalReviews || 0,
    },
    recentReviews,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBusinessData(slug);
  if (!data) return { title: 'Business Not Found — BookBetter' };

  return {
    title: `Book with ${data.tenant.name} — BookBetter`,
    description: data.tenant.description || `Book appointments with ${data.tenant.name}`,
  };
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getBusinessData(slug);

  if (!data) notFound();

  // Check booking limit for Starter plan
  let bookingLimitReached = false;
  if (data.tenant.plan === 'starter') {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [monthCount] = await db
      .select({ count: count(bookings.id) })
      .from(bookings)
      .where(
        and(
          eq(bookings.tenantId, data.tenant.id),
          gte(bookings.createdAt, startOfMonth)
        )
      );

    const limit = data.tenant.bookingsQuota || 15;
    bookingLimitReached = (monthCount?.count || 0) >= limit;
  }

  return (
    <BookingFlow
      tenant={data.tenant}
      services={data.services}
      templates={data.templates}
      exceptions={data.exceptions}
      reviewStats={data.reviewStats}
      recentReviews={data.recentReviews}
      bookingLimitReached={bookingLimitReached}
    />
  );
}