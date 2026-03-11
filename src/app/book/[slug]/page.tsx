// src/app/book/[slug]/page.tsx
import { db } from '@/db';
import { tenants, services, availabilityTemplates, availabilityExceptions, reviews, bookings } from '@/db/schema';
import { eq, and, avg, count, gte } from 'drizzle-orm';
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

  // Get review stats
  const [reviewStats] = await db
    .select({
      avgRating: avg(reviews.rating),
      totalReviews: count(reviews.id),
    })
    .from(reviews)
    .where(eq(reviews.tenantId, tenant.id));

  return {
    tenant,
    services: serviceList,
    templates,
    exceptions,
    reviewStats: {
      avgRating: reviewStats?.avgRating ? parseFloat(reviewStats.avgRating) : null,
      totalReviews: reviewStats?.totalReviews || 0,
    },
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

  return (
    <BookingFlow
      tenant={data.tenant}
      services={data.services}
      templates={data.templates}
      exceptions={data.exceptions}
      reviewStats={data.reviewStats}
    />
  );
}