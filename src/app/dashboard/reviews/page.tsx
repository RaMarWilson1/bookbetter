// src/app/dashboard/reviews/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { reviews, bookings, services, users, staffAccounts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ReviewsContent } from './_components/reviews-content';

async function getReviews(userId: string) {
  const staffRecord = await db
    .select({ tenantId: staffAccounts.tenantId })
    .from(staffAccounts)
    .where(eq(staffAccounts.userId, userId))
    .limit(1);

  if (!staffRecord[0]) return [];

  const results = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      response: reviews.response,
      respondedAt: reviews.respondedAt,
      createdAt: reviews.createdAt,
      clientName: bookings.clientName,
      serviceName: services.name,
    })
    .from(reviews)
    .leftJoin(bookings, eq(reviews.bookingId, bookings.id))
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(reviews.tenantId, staffRecord[0].tenantId))
    .orderBy(desc(reviews.createdAt))
    .limit(50);

  return results;
}

export default async function ReviewsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in');

  const reviewList = await getReviews(session.user.id);

  return <ReviewsContent reviews={reviewList} />;
}