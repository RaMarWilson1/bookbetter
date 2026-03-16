// src/app/dashboard/_components/overview-content.tsx
'use client';

import { useState, useEffect } from 'react';
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
  CreditCard,
  Check,
  Lock,
  BarChart3,
  Repeat,
  Flame,
  Loader2,
} from 'lucide-react';
import { UpgradeBanner } from './upgrade-prompt';

interface Appointment {
  id: string;
  clientName: string | null;
  startTime: string;
  endTime: string;
  status: string;
  serviceName: string | null;
  priceCents: number | null;
}

interface Analytics {
  weekRevenue: number;
  lastWeekRevenue: number;
  revenueByDay: { day: string; total: number }[];
  topServices: { name: string; bookingCount: number; revenue: number }[];
  retentionRate: number;
  repeatClients: number;
  uniqueClients: number;
  heatmap: { day: number; hour: number; count: number }[];
}

interface OverviewData {
  plan: string;
  slug: string;
  todayBookings: number;
  monthBookings: number;
  bookingsQuota: number;
  totalClients: number;
  completionRate: number | null;
  weekRevenue: number;
  todayAppointments: Appointment[];
  setupComplete: {
    hasServices: boolean;
    hasAvailability: boolean;
    hasStripe: boolean;
    allDone: boolean;
  };
  analytics: Analytics | null;
}

interface OverviewContentProps {
  userName: string;
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-red-50 text-red-700',
  'no-show': 'bg-slate-100 text-slate-600',
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function OverviewContent({ userName }: OverviewContentProps) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const firstName = userName.split(' ')[0];
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    fetch('/api/dashboard/overview')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-24 text-slate-500">
        Failed to load dashboard data.
      </div>
    );
  }

  const isStarter = data.plan === 'starter';
  const revenueChange =
    data.analytics && data.analytics.lastWeekRevenue > 0
      ? Math.round(
          ((data.analytics.weekRevenue - data.analytics.lastWeekRevenue) /
            data.analytics.lastWeekRevenue) *
            100
        )
      : null;

  // Build the stat cards
  const statCards = [
    {
      label: "Today's Bookings",
      value: String(data.todayBookings),
      icon: Calendar,
      color: 'bg-blue-500/10 text-blue-600',
      href: '/dashboard/appointments',
    },
    {
      label: "This Week's Revenue",
      value: formatPrice(data.analytics?.weekRevenue || data.weekRevenue || 0),
      change: revenueChange,
      icon: DollarSign,
      color: 'bg-emerald-500/10 text-emerald-600',
      href: '/dashboard/payments',
    },
    {
      label: 'Total Clients',
      value: String(data.totalClients),
      icon: Users,
      color: 'bg-violet-500/10 text-violet-600',
      href: '/dashboard/clients',
    },
    {
      label: 'Completion Rate',
      value: data.completionRate !== null ? `${data.completionRate}%` : '—',
      icon: TrendingUp,
      color: 'bg-amber-500/10 text-amber-600',
      href: '/dashboard/appointments',
    },
  ];

  // Setup checklist items
  const checklistItems = [
    {
      label: 'Add Service',
      description: 'Set up a new service with pricing',
      href: '/dashboard/services',
      icon: Scissors,
      color: 'bg-blue-500/10 text-blue-600',
      done: data.setupComplete.hasServices,
    },
    {
      label: 'Set Availability',
      description: 'Configure your working hours',
      href: '/dashboard/availability',
      icon: Clock,
      color: 'bg-emerald-500/10 text-emerald-600',
      done: data.setupComplete.hasAvailability,
    },
    {
      label: 'Connect Stripe',
      description: 'Start accepting payments',
      href: '/dashboard/settings',
      icon: CreditCard,
      color: 'bg-violet-500/10 text-violet-600',
      done: data.setupComplete.hasStripe,
    },
    {
      label: 'Share Booking Page',
      description: 'Get your link to share with clients',
      href: `/book/${data.slug}`,
      icon: CalendarPlus,
      color: 'bg-amber-500/10 text-amber-600',
      done: data.setupComplete.hasServices && data.setupComplete.hasAvailability,
    },
  ];

  // Heatmap helpers
  const maxHeatmapCount = data.analytics?.heatmap
    ? Math.max(...data.analytics.heatmap.map((h) => h.count), 1)
    : 1;

  function getHeatmapColor(count: number) {
    if (count === 0) return 'bg-slate-100';
    const intensity = count / maxHeatmapCount;
    if (intensity > 0.75) return 'bg-blue-600';
    if (intensity > 0.5) return 'bg-blue-400';
    if (intensity > 0.25) return 'bg-blue-300';
    return 'bg-blue-200';
  }

  function getHeatmapCount(day: number, hour: number) {
    return data?.analytics?.heatmap.find((h) => h.day === day && h.hour === hour)?.count || 0;
  }

  // Revenue chart max
  const maxRevenue = data.analytics?.revenueByDay
    ? Math.max(...data.analytics.revenueByDay.map((d) => d.total), 1)
    : 1;

  return (
    <div className="space-y-6">
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
      {isStarter && (
        <UpgradeBanner
          type={data.monthBookings >= data.bookingsQuota ? 'limit' : 'warning'}
          bookingsUsed={data.monthBookings}
          bookingsLimit={data.bookingsQuota}
          plan={data.plan}
        />
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const change = 'change' in stat ? (stat as { change: number | null }).change : null;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-white rounded-xl border border-slate-200/60 p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {change !== null && change !== undefined && (
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      change >= 0
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-red-600 bg-red-50'
                    }`}
                  >
                    {change >= 0 ? '+' : ''}{change}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Main content grid */}
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
            {data.todayAppointments.length === 0 ? (
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
            ) : (
              <div className="space-y-2">
                {data.todayAppointments.map((apt) => (
                  <Link
                    key={apt.id}
                    href="/dashboard/appointments"
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="text-center shrink-0 w-14">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatTime(apt.startTime)}
                      </p>
                    </div>
                    <div className="w-px h-10 bg-slate-200 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {apt.clientName || 'Walk-in'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {apt.serviceName}
                        {apt.priceCents ? ` · ${formatPrice(apt.priceCents)}` : ''}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${
                        STATUS_STYLES[apt.status] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar — Get Started (auto-hides when complete) OR Quick Actions */}
        <div className="space-y-6">
          {!data.setupComplete.allDone && (
            <div className="bg-white rounded-xl border border-slate-200/60">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Get Started</h3>
                <p className="text-sm text-slate-500 mt-0.5">Set up your business</p>
              </div>
              <div className="p-3 space-y-1">
                {checklistItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          item.done
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : item.color
                        }`}
                      >
                        {item.done ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            item.done ? 'text-slate-400 line-through' : 'text-slate-900'
                          }`}
                        >
                          {item.label}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {item.done ? 'Complete' : item.description}
                        </p>
                      </div>
                      {!item.done && (
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Booking link */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5">
            <p className="text-xs text-slate-400 mb-1">Your booking page</p>
            <p className="text-sm text-white font-medium truncate mb-3">
              thebookbetter.com/book/{data.slug}
            </p>
            <a
              href={`/book/${data.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2 px-3 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-md transition-colors text-center"
            >
              View booking page →
            </a>
          </div>

          {/* Starter — locked analytics teaser */}
          {isStarter && (
            <div className="bg-white rounded-xl border border-slate-200/60 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-slate-400" />
                <h3 className="font-semibold text-slate-900 text-sm">Advanced Analytics</h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Revenue tracking, top services, client retention, and busiest times — available on Growth.
              </p>
              <Link
                href="/dashboard/settings/billing"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View plans <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ─── Growth+ Analytics Section ─────────────────────── */}
      {!isStarter && data.analytics && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-400" />
            <h3 className="text-lg font-bold text-slate-900">Analytics</h3>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-xl border border-slate-200/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-slate-900">Revenue</h4>
                <p className="text-sm text-slate-500">Last 30 days</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatPrice(data.analytics.revenueByDay.reduce((sum, d) => sum + d.total, 0))}
              </p>
            </div>
            {data.analytics.revenueByDay.length > 0 ? (
              <div className="flex items-end gap-[2px] h-32">
                {data.analytics.revenueByDay.map((d, i) => {
                  const height = Math.max((d.total / maxRevenue) * 100, 2);
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-blue-400 hover:bg-blue-500 rounded-t transition-colors cursor-default group relative"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                        {new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        : {formatPrice(d.total)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-sm text-slate-400">
                No revenue data yet
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Services */}
            <div className="bg-white rounded-xl border border-slate-200/60 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-4 h-4 text-amber-500" />
                <h4 className="font-semibold text-slate-900">Top Services</h4>
              </div>
              {data.analytics.topServices.length > 0 ? (
                <div className="space-y-3">
                  {data.analytics.topServices.map((svc, i) => {
                    const maxCount = data.analytics!.topServices[0].bookingCount;
                    const width = Math.max((svc.bookingCount / maxCount) * 100, 8);
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-slate-700 truncate">
                            {svc.name}
                          </p>
                          <span className="text-xs text-slate-500 shrink-0 ml-2">
                            {svc.bookingCount} bookings
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-amber-400 h-1.5 rounded-full transition-all"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-6">
                  No booking data yet
                </p>
              )}
            </div>

            {/* Client Retention */}
            <div className="bg-white rounded-xl border border-slate-200/60 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Repeat className="w-4 h-4 text-violet-500" />
                <h4 className="font-semibold text-slate-900">Client Retention</h4>
              </div>
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-slate-900">
                  {data.analytics.retentionRate}%
                </p>
                <p className="text-sm text-slate-500 mt-1">Repeat clients</p>
                <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {data.analytics.uniqueClients}
                    </p>
                    <p>Total</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {data.analytics.repeatClients}
                    </p>
                    <p>Repeat</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Busiest Times Heatmap */}
            <div className="bg-white rounded-xl border border-slate-200/60 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-blue-500" />
                <h4 className="font-semibold text-slate-900">Busiest Times</h4>
              </div>
              {data.analytics.heatmap.length > 0 ? (
                <div className="space-y-1">
                  {/* Hours header */}
                  <div className="flex items-center gap-1 ml-8">
                    {[8, 10, 12, 14, 16, 18].map((h) => (
                      <div key={h} className="flex-1 text-center">
                        <span className="text-[10px] text-slate-400">
                          {h > 12 ? `${h - 12}p` : h === 12 ? '12p' : `${h}a`}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Grid rows */}
                  {DAY_LABELS.map((dayLabel, dayIdx) => (
                    <div key={dayIdx} className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 w-7 text-right shrink-0">
                        {dayLabel}
                      </span>
                      <div className="flex-1 flex gap-[2px]">
                        {Array.from({ length: 12 }, (_, i) => i + 7).map((hourIdx) => {
                          const cnt = getHeatmapCount(dayIdx, hourIdx);
                          return (
                            <div
                              key={hourIdx}
                              className={`flex-1 aspect-square rounded-sm ${getHeatmapColor(cnt)} cursor-default group relative`}
                            >
                              {cnt > 0 && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                                  {cnt} booking{cnt !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {/* Legend */}
                  <div className="flex items-center justify-end gap-1 mt-2">
                    <span className="text-[10px] text-slate-400 mr-1">Less</span>
                    <div className="w-3 h-3 rounded-sm bg-slate-100" />
                    <div className="w-3 h-3 rounded-sm bg-blue-200" />
                    <div className="w-3 h-3 rounded-sm bg-blue-300" />
                    <div className="w-3 h-3 rounded-sm bg-blue-400" />
                    <div className="w-3 h-3 rounded-sm bg-blue-600" />
                    <span className="text-[10px] text-slate-400 ml-1">More</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-6">
                  Need more booking data
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}