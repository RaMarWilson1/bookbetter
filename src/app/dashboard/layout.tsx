// src/app/dashboard/layout.tsx
import { requireRole } from '@/lib/auth-utils';
import { DashboardShell } from './_components/dashboard-shell';

export const metadata = {
  title: 'Dashboard — BookBetter',
  description: 'Manage your bookings, services, and clients',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(['pro', 'staff']);

  return (
    <DashboardShell user={session.user}>
      {children}
    </DashboardShell>
  );
}