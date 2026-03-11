// src/app/search/page.tsx
import { db } from '@/db';
import { tenants, services, reviews, staffAccounts, users } from '@/db/schema';
import { eq, and, avg, count, sql } from 'drizzle-orm';
import { SearchContent } from './_components/search-content';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find a Professional — BookBetter',
  description: 'Browse and book service professionals near you.',
};

export const dynamic = 'force-dynamic';

async function getBusinesses() {
  // Get all active tenants with their review stats and service count
  const businessList = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      description: tenants.description,
      city: tenants.city,
      state: tenants.state,
      logo: tenants.logo,
      primaryColor: tenants.primaryColor,
      phone: tenants.phone,
      createdAt: tenants.createdAt,
    })
    .from(tenants)
    .where(eq(tenants.active, true));

  // Get review stats and service counts for each tenant
  const enriched = await Promise.all(
    businessList.map(async (biz) => {
      const [reviewStats] = await db
        .select({
          avgRating: avg(reviews.rating),
          totalReviews: count(reviews.id),
        })
        .from(reviews)
        .where(eq(reviews.tenantId, biz.id));

      const [serviceStats] = await db
        .select({
          serviceCount: count(services.id),
        })
        .from(services)
        .where(and(eq(services.tenantId, biz.id), eq(services.active, true)));

      // Get lowest price
      const [cheapest] = await db
        .select({ minPrice: sql<number>`MIN(${services.priceCents})` })
        .from(services)
        .where(and(eq(services.tenantId, biz.id), eq(services.active, true)));

      return {
        ...biz,
        avgRating: reviewStats?.avgRating ? parseFloat(reviewStats.avgRating) : null,
        totalReviews: reviewStats?.totalReviews || 0,
        serviceCount: serviceStats?.serviceCount || 0,
        startingPrice: cheapest?.minPrice || null,
      };
    })
  );

  // Only return businesses that have at least 1 service
  return enriched.filter((b) => b.serviceCount > 0);
}

export default async function SearchPage() {
  const businesses = await getBusinesses();

  return <SearchContent businesses={businesses} />;
}