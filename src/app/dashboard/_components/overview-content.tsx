// src/app/dashboard/_components/overview-content.tsx
'use client';

import Link from 'next/link';
import {
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Plus,
  Clock,
  ArrowRight,
  Scissors,
  CalendarPlus,
} from 'lucide-react';
import { UpgradeBanner } from './upgrade-prompt';

interface OverviewContentProps {
  userName: string;
  tenantSlug: string | null;
  plan?: string;
  bookingsUsed?: number;
  bookingsLimit?: number;
}

export function OverviewContent({ userName, tenantSlug, plan, bookingsUsed, bookingsLimit }: OverviewContentProps) {
  const firstName = userName.split(' ')[0];
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Placeholder data — will be replaced with real DB queries
  const stats = [
    {
      label: "Today's Bookings",
      value: '0',
      change: '',
      icon: Calendar,
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      label: "This Week's Revenue",
      value: '$0',
      change: '',
      icon: DollarSign,
      color: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      label: 'Total Clients',
      value: '0',
      change: '',
      icon: Users,
      color: 'bg-violet-500/10 text-violet-600',
    },
    {
      label: 'Completion Rate',
      value: '—',
      change: '',
      icon: TrendingUp,
      color: 'bg-amber-500/10 text-amber-600',
    },
  ];

  const quickActions = [
    {
      label: 'Add Service',
      description: 'Set up a new service with pricing',
      href: '/dashboard/services',
      icon: Scissors,
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      label: 'Set Availability',
      description: 'Configure your working hours',
      href: '/dashboard/availability',
      icon: Clock,
      color: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      label: 'Share Booking Page',
      description: 'Get your link to share with clients',
      href: '/dashboard/settings',
      icon: CalendarPlus,
      color: 'bg-violet-500/10 text-violet-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {greeting}, {firstName}
        </h2>
        <p className="text-slate-500 mt-1">
          Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      {/* Upgrade prompts for Starter plan */}
      {plan === 'starter' && bookingsUsed !== undefined && bookingsLimit !== undefined && (
        <>
          <UpgradeBanner
            type="limit"
            bookingsUsed={bookingsUsed}
            bookingsLimit={bookingsLimit}
            plan={plan}
          />
          <UpgradeBanner
            type="warning"
            bookingsUsed={bookingsUsed}
            bookingsLimit={bookingsLimit}
            plan={plan}
          />
        </>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-slate-200/60 p-5 hover:shadow-md hover:border-slate-200 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {stat.change && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/60">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-slate-900">Today&apos;s Schedule</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <Link
              href="/dashboard/appointments"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5">
            {/* Empty state */}
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-900 font-medium mb-1">No appointments today</p>
              <p className="text-sm text-slate-500 mb-4">
                Your schedule is clear. Set up your services and availability to start getting booked.
              </p>
              <Link
                href="/dashboard/services"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add your first service
              </Link>
            </div>

            {/* 
              When there are appointments, replace empty state with:
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} />
                ))}
              </div>
            */}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200/60">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Get Started</h3>
            <p className="text-sm text-slate-500 mt-0.5">Set up your business</p>
          </div>

          <div className="p-3 space-y-1">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${action.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {action.label}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>

          {/* Booking link preview */}
          <div className="m-3 mt-2 p-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">Your booking page</p>
            <p className="text-sm text-white font-medium truncate mb-3">
              {tenantSlug
                ? `bookbetter.vercel.app/book/${tenantSlug}`
                : 'bookbetter.vercel.app/book/...'}
            </p>
            <Link
              href="/dashboard/settings"
              className="block w-full py-2 px-3 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-md transition-colors text-center"
            >
              Set up booking page →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-200/60">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Recent Activity</h3>
        </div>
        <div className="p-5">
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">
              Activity from bookings, reviews, and payments will show up here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}