// src/app/cancel/[id]/page.tsx
import { CancelFlow } from './_components/cancel-flow';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cancel Booking — BookBetter',
};

export default async function CancelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CancelFlow bookingId={id} />;
}