// src/app/my-bookings/_components/my-bookings-content.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  XCircle,
  RefreshCw,
  ChevronRight,
  CalendarPlus,
  Loader2,
  Search,
  Inbox,
  ArrowLeft,
  Phone,
  Mail,
  ExternalLink,
} from 'lucide-react';

interface Booking {
  id: string;
  startUtc: string;
  endUtc: string;
  status: string;
  paymentStatus: string;
  clientNotes: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  serviceName: string;
  serviceDescription: string | null;
  servicePriceCents: number;
  serviceDurationMinutes: number;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantPhone: string | null;
  tenantEmail: string | null;
  tenantAddress: string | null;
  tenantCity: string | null;
  tenantState: string | null;
  tenantLogo: string | null;
  tenantPrimaryColor: string | null;
  reviewId: string | null;
  reviewRating: number | null;
  reviewComment: string | null;
  proposedStartUtc: string | null;
  proposedEndUtc: string | null;
  proposedAt: string | null;
  rescheduleNote: string | null;
}

interface MyBookingsContentProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

type Tab = 'upcoming' | 'past' | 'cancelled';

export function MyBookingsContent({ user }: MyBookingsContentProps) {
  const [tab, setTab] = useState<Tab>('upcoming');
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<{
    upcoming: Booking[];
    past: Booking[];
    cancelled: Booking[];
    total: number;
  }>({ upcoming: [], past: [], cancelled: [], total: 0 });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/my-bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const currentBookings = bookings[tab];

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'upcoming', label: 'Upcoming', count: bookings.upcoming.length },
    { key: 'past', label: 'Past', count: bookings.past.length },
    { key: 'cancelled', label: 'Cancelled', count: bookings.cancelled.length },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-1.5 -ml-1.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-slate-900">My Bookings</h1>
                <p className="text-sm text-slate-500">
                  {user.name ? `Hey ${user.name.split(' ')[0]}` : 'Welcome back'}
                </p>
              </div>
            </div>
            <Link
              href="/search"
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Search className="w-4 h-4" />
              Book a service
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${
                tab === t.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    tab === t.key
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && currentBookings.length === 0 && (
          <EmptyState tab={tab} />
        )}

        {/* Booking Cards */}
        {!loading && currentBookings.length > 0 && (
          <div className="space-y-3">
            {currentBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} tab={tab} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const content = {
    upcoming: {
      icon: Calendar,
      title: 'No upcoming bookings',
      description: 'Find a service provider and book your next appointment.',
      cta: 'Browse services',
      href: '/search',
    },
    past: {
      icon: Inbox,
      title: 'No past bookings',
      description: 'Your completed appointments will show up here.',
      cta: 'Book your first appointment',
      href: '/search',
    },
    cancelled: {
      icon: XCircle,
      title: 'No cancelled bookings',
      description: 'Nothing to see here — and that\'s a good thing!',
      cta: null,
      href: null,
    },
  }[tab];

  const Icon = content.icon;

  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{content.title}</h3>
      <p className="text-sm text-slate-500 mb-5">{content.description}</p>
      {content.cta && content.href && (
        <Link
          href={content.href}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Search className="w-4 h-4" />
          {content.cta}
        </Link>
      )}
    </div>
  );
}

function BookingCard({ booking, tab }: { booking: Booking; tab: Tab }) {
  const [showDetails, setShowDetails] = useState(false);
  const date = new Date(booking.startUtc);
  const endDate = new Date(booking.endUtc);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow =
    date.toDateString() ===
    new Date(now.getTime() + 86400000).toDateString();

  const formatDate = (d: Date) => {
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);

  const statusBadge = () => {
    if (booking.status === 'cancelled') {
      return (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
          Cancelled
        </span>
      );
    }
    if (booking.status === 'completed') {
      return (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
          Completed
        </span>
      );
    }
    if (booking.status === 'no_show') {
      return (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
          No show
        </span>
      );
    }
    if (booking.paymentStatus === 'paid') {
      return (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
          Paid
        </span>
      );
    }
    if (booking.status === 'confirmed') {
      return (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
          Confirmed
        </span>
      );
    }
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
        Pending
      </span>
    );
  };

  // Can cancel if upcoming and not already cancelled
  const canCancel =
    tab === 'upcoming' && booking.status !== 'cancelled';

  // Can leave a review if past and completed and no review yet
  const canReview =
    tab === 'past' &&
    (booking.status === 'confirmed' || booking.status === 'completed') &&
    !booking.reviewId;

  // Can rebook if past or cancelled
  const canRebook = tab === 'past' || tab === 'cancelled';

  // Can add to calendar if upcoming
  const canAddToCalendar = tab === 'upcoming';

  // Accent color from the tenant
  const accentColor = booking.tenantPrimaryColor || '#3B82F6';

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden hover:border-slate-300 transition-colors">
      {/* Color accent bar */}
      <div className="h-1" style={{ backgroundColor: accentColor }} />

      <div className="p-4 sm:p-5">
        {/* Top row: date + status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: accentColor }}
            >
              {date.toLocaleDateString('en-US', { day: 'numeric' })}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {formatDate(date)}
              </p>
              <p className="text-xs text-slate-500">
                {formatTime(date)} – {formatTime(endDate)}
              </p>
            </div>
          </div>
          {statusBadge()}
        </div>

        {/* Service + Business */}
        <div className="mb-3">
          <h3 className="text-base font-semibold text-slate-900">
            {booking.serviceName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-slate-600">
              at{' '}
              <Link
                href={`/book/${booking.tenantSlug}`}
                className="font-medium text-slate-700 hover:text-slate-900 underline-offset-2 hover:underline"
              >
                {booking.tenantName}
              </Link>
            </span>
          </div>
        </div>

        {/* Quick info row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {booking.serviceDurationMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <span className="font-medium text-slate-700">
              {formatPrice(booking.servicePriceCents)}
            </span>
          </span>
          {booking.tenantCity && booking.tenantState && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {booking.tenantCity}, {booking.tenantState}
            </span>
          )}
        </div>

        {/* Existing review */}
        {booking.reviewId && booking.reviewRating && (
          <div className="bg-slate-50 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-1 mb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < booking.reviewRating!
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              ))}
              <span className="text-xs text-slate-500 ml-1">Your review</span>
            </div>
            {booking.reviewComment && (
              <p className="text-sm text-slate-600">{booking.reviewComment}</p>
            )}
          </div>
        )}

        {/* Cancellation reason */}
        {booking.status === 'cancelled' && booking.cancellationReason && (
          <div className="bg-red-50 rounded-lg p-3 mb-3">
            <p className="text-xs font-medium text-red-600 mb-0.5">
              Cancellation reason
            </p>
            <p className="text-sm text-red-700">{booking.cancellationReason}</p>
          </div>
        )}

        {/* Reschedule proposal from pro */}
        {booking.proposedStartUtc && tab === 'upcoming' && (
          <RescheduleBanner booking={booking} />
        )}

        {/* Expandable details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-3 transition-colors"
        >
          <ChevronRight
            className={`w-3.5 h-3.5 transition-transform ${
              showDetails ? 'rotate-90' : ''
            }`}
          />
          {showDetails ? 'Hide details' : 'Show details'}
        </button>

        {showDetails && (
          <div className="bg-slate-50 rounded-lg p-3 mb-3 space-y-2 text-sm">
            {booking.clientNotes && (
              <div>
                <span className="text-slate-500 text-xs font-medium">
                  Your notes:
                </span>
                <p className="text-slate-700">{booking.clientNotes}</p>
              </div>
            )}
            {booking.tenantAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <span className="text-slate-600">
                  {booking.tenantAddress}
                  {booking.tenantCity && `, ${booking.tenantCity}`}
                  {booking.tenantState && `, ${booking.tenantState}`}
                </span>
              </div>
            )}
            {booking.tenantPhone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <a
                  href={`tel:${booking.tenantPhone}`}
                  className="text-slate-600 hover:text-slate-900"
                >
                  {booking.tenantPhone}
                </a>
              </div>
            )}
            {booking.tenantEmail && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <a
                  href={`mailto:${booking.tenantEmail}`}
                  className="text-slate-600 hover:text-slate-900"
                >
                  {booking.tenantEmail}
                </a>
              </div>
            )}
            <div className="text-xs text-slate-400 pt-1">
              Booked on{' '}
              {new Date(booking.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {canCancel && (
            <Link
              href={`/cancel/${booking.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel
            </Link>
          )}

          {canAddToCalendar && (
            <a
              href={`/api/book/${booking.id}/calendar`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Add to calendar
            </a>
          )}

          {canRebook && (
            <Link
              href={`/book/${booking.tenantSlug}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Book again
            </Link>
          )}

          {canReview && (
            <Link
              href={`/my-bookings/${booking.id}/review`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <Star className="w-3.5 h-3.5" />
              Leave a review
            </Link>
          )}

          <Link
            href={`/book/${booking.tenantSlug}`}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors ml-auto"
          >
            View provider
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function RescheduleBanner({ booking }: { booking: Booking }) {
  const [responding, setResponding] = useState(false);

  const proposedDate = new Date(booking.proposedStartUtc!);

  const handleRespond = async (action: 'accept_reschedule' | 'decline_reschedule') => {
    setResponding(true);
    try {
      await fetch(`/api/my-bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      window.location.reload();
    } catch {
      setResponding(false);
    }
  };

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
      <p className="text-sm font-medium text-purple-800 flex items-center gap-1.5">
        <RefreshCw className="w-3.5 h-3.5" />
        New time proposed
      </p>
      <p className="text-sm text-purple-700 mt-0.5">
        {proposedDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}{' '}
        at{' '}
        {proposedDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })}
      </p>
      {booking.rescheduleNote && (
        <p className="text-xs text-purple-600 mt-1 italic">
          &quot;{booking.rescheduleNote}&quot;
        </p>
      )}
      <div className="flex items-center gap-2 mt-2.5">
        <button
          onClick={() => handleRespond('accept_reschedule')}
          disabled={responding}
          className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {responding ? 'Updating...' : 'Accept New Time'}
        </button>
        <Link
          href={`/book/${booking.tenantSlug}`}
          onClick={() => handleRespond('decline_reschedule')}
          className="px-3 py-1.5 bg-white border border-purple-200 text-purple-700 text-xs font-medium rounded-md hover:bg-purple-50 transition-colors flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Reschedule
        </Link>
      </div>
    </div>
  );
}