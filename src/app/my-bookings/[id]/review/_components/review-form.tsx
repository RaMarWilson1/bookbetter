// src/app/my-bookings/[id]/review/_components/review-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star,
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface ReviewFormProps {
  booking: {
    id: string;
    startUtc: string;
    serviceName: string;
    servicePriceCents: number;
    serviceDurationMinutes: number;
    tenantName: string;
    tenantSlug: string;
    tenantLogo: string | null;
    tenantPrimaryColor: string | null;
  };
}

const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export function ReviewForm({ booking }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accentColor = booking.tenantPrimaryColor || '#3B82F6';

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/my-bookings/${booking.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const date = new Date(booking.startUtc);

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Thanks for your review!
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Your feedback helps {booking.tenantName} improve and helps other
            clients make informed decisions.
          </p>
          <div className="flex items-center justify-center gap-1 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-6 h-6 ${
                  i < rating
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-200'
                }`}
              />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/my-bookings"
              className="px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              Back to My Bookings
            </Link>
            <Link
              href={`/book/${booking.tenantSlug}`}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
            >
              Book again with {booking.tenantName}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/my-bookings"
              className="p-1.5 -ml-1.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-slate-900">Leave a Review</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-6">
        {/* Booking summary card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="h-1 -mt-4 -mx-4 mb-4 rounded-t-xl" style={{ backgroundColor: accentColor }} />
          <h3 className="font-semibold text-slate-900">{booking.serviceName}</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            at {booking.tenantName}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
              {' at '}
              {date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
            <span>{booking.serviceDurationMinutes} min</span>
          </div>
        </div>

        {/* Rating */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <label className="block text-sm font-semibold text-slate-900 mb-3">
            How was your experience?
          </label>
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => {
                  setRating(star);
                  setError(null);
                }}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-200 hover:text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {(hoveredRating || rating) > 0 && (
            <p className="text-center text-sm font-medium text-slate-600">
              {ratingLabels[hoveredRating || rating]}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <label
            htmlFor="comment"
            className="block text-sm font-semibold text-slate-900 mb-2"
          >
            Add a comment{' '}
            <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details about your experience..."
            rows={4}
            maxLength={1000}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
          />
          <p className="text-xs text-slate-400 mt-1 text-right">
            {comment.length}/1000
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Review
            </>
          )}
        </button>
      </main>
    </div>
  );
}