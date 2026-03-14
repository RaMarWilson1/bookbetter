// src/app/dashboard/reviews/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { reviews, bookings, services, staffAccounts, tenants } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ReviewsContent } from './_components/reviews-content';

async function getReviewsData(userId: string) {
  const [staffRecord] = await db
    .select({
      tenantId: staffAccounts.tenantId,
      role: staffAccounts.role,
    })
    .from(staffAccounts)
    .where(eq(staffAccounts.userId, userId))
    .limit(1);

  if (!staffRecord) return null;

  const [tenant] = await db
    .select({ plan: tenants.plan })
    .from(tenants)
    .where(eq(tenants.id, staffRecord.tenantId))
    .limit(1);

  const reviewList = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      response: reviews.response,
      respondedAt: reviews.respondedAt,
      flagged: reviews.flagged,
      approved: reviews.approved,
      createdAt: reviews.createdAt,
      clientName: bookings.clientName,
      serviceName: services.name,
    })
    .from(reviews)
    .leftJoin(bookings, eq(reviews.bookingId, bookings.id))
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(reviews.tenantId, staffRecord.tenantId))
    .orderBy(desc(reviews.createdAt))
    .limit(50);

  return {
    reviews: reviewList,
    plan: tenant?.plan || 'starter',
    role: staffRecord.role,
  };
}

export default async function ReviewsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in');

  const data = await getReviewsData(session.user.id);
  if (!data) redirect('/dashboard');

  return (
    <ReviewsContent
      reviews={data.reviews}
      plan={data.plan}
      role={data.role}
    />
  );
}