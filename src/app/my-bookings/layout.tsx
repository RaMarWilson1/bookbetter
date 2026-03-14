// src/app/my-bookings/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Bookings — BookBetter',
  description: 'View and manage your upcoming and past appointments.',
};

export default function MyBookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}