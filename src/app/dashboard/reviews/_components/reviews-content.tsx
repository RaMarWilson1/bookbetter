// src/app/dashboard/reviews/_components/reviews-content.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star,
  MessageSquare,
  Send,
  EyeOff,
  Trash2,
  Lock,
  ArrowRight,
  Eye,
} from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  response: string | null;
  respondedAt: Date | null;
  flagged: boolean | null;
  approved: boolean | null;
  createdAt: Date;
  clientName: string | null;
  serviceName: string | null;
}

interface ReviewsContentProps {
  reviews: Review[];
  plan: string;
  role: string;
}

export function ReviewsContent({ reviews, plan, role }: ReviewsContentProps) {
  const router = useRouter();
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const canRespond = plan !== 'starter';
  const canRemove = plan !== 'starter' && role === 'owner';
  const isStarter = plan === 'starter';

  const visibleReviews = reviews;
  const hiddenCount = reviews.filter((r) => r.approved === false).length;

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  const handleRespond = async (id: string) => {
    if (!responseText.trim()) return;
    setLoading(true);

    try {
      await fetch(`/api/dashboard/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: responseText }),
      });
      setRespondingTo(null);
      setResponseText('');
      router.refresh();
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (id: string, currentlyApproved: boolean | null) => {
    setLoading(true);
    try {
      await fetch(`/api/dashboard/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: !(currentlyApproved ?? true) }),
      });
      router.refresh();
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await fetch(`/api/dashboard/reviews/${id}`, {
        method: 'DELETE',
      });
      setConfirmDelete(null);
      router.refresh();
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const Stars = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Reviews</h2>
        <p className="text-slate-500 mt-1">See what your clients are saying.</p>
      </div>

      {/* Starter plan upgrade banner */}
      {isStarter && reviews.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-200/60 rounded-xl p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              Upgrade to respond to reviews and manage visibility
            </p>
            <p className="text-xs text-blue-700/70 mt-0.5">
              Growth plan lets you respond to reviews and hide ones you don&apos;t want shown. Build trust with potential clients.
            </p>
            <Link
              href="/dashboard/settings/billing"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-2"
            >
              View plans
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200/60 p-5">
            <p className="text-3xl font-bold text-slate-900">{avgRating}</p>
            <p className="text-sm text-slate-500 mt-1">Average rating</p>
            <Stars rating={Math.round(parseFloat(avgRating as string))} />
          </div>
          <div className="bg-white rounded-xl border border-slate-200/60 p-5">
            <p className="text-3xl font-bold text-slate-900">{reviews.length}</p>
            <p className="text-sm text-slate-500 mt-1">Total reviews</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/60 p-5">
            <p className="text-3xl font-bold text-slate-900">
              {reviews.filter((r) => r.response).length}
            </p>
            <p className="text-sm text-slate-500 mt-1">Responded</p>
          </div>
          {canRemove && (
            <div className="bg-white rounded-xl border border-slate-200/60 p-5">
              <p className="text-3xl font-bold text-slate-900">{hiddenCount}</p>
              <p className="text-sm text-slate-500 mt-1">Hidden</p>
            </div>
          )}
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/60 p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Star className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-900 font-medium mb-1">No reviews yet</p>
          <p className="text-sm text-slate-500">
            Reviews will appear here after clients complete their bookings.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleReviews.map((review) => {
            const isHidden = review.approved === false;

            return (
              <div
                key={review.id}
                className={`bg-white rounded-xl border border-slate-200/60 p-5 ${
                  isHidden ? 'opacity-60 bg-slate-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Stars rating={review.rating} />
                      <span className="text-xs text-slate-400">
                        {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {isHidden && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {review.clientName || 'Anonymous'}
                    </p>
                    {review.serviceName && (
                      <p className="text-xs text-slate-500">{review.serviceName}</p>
                    )}
                  </div>

                  {/* Owner actions: hide/show + delete */}
                  {canRemove && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleVisibility(review.id, review.approved)}
                        disabled={loading}
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        title={isHidden ? 'Show on booking page' : 'Hide from booking page'}
                      >
                        {isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(review.id)}
                        disabled={loading}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {review.comment && (
                  <p className="text-sm text-slate-700 mt-3">{review.comment}</p>
                )}

                {/* Existing response */}
                {review.response && (
                  <div className="mt-4 pl-4 border-l-2 border-slate-200">
                    <p className="text-xs font-medium text-slate-500 mb-1">Your response</p>
                    <p className="text-sm text-slate-700">{review.response}</p>
                  </div>
                )}

                {/* Response form (Growth+ only) */}
                {canRespond && !review.response && respondingTo === review.id && (
                  <div className="mt-4 flex items-end gap-2">
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Write your response..."
                      rows={2}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    />
                    <button
                      onClick={() => handleRespond(review.id)}
                      disabled={loading || !responseText.trim()}
                      className="p-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Respond button (Growth+ only) */}
                {canRespond && !review.response && respondingTo !== review.id && (
                  <button
                    onClick={() => { setRespondingTo(review.id); setResponseText(''); }}
                    className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Respond
                  </button>
                )}

                {/* Locked respond for Starter */}
                {!canRespond && !review.response && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                    Upgrade to Growth to respond to reviews
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Delete review?</h3>
            <p className="text-sm text-slate-500 mb-5">
              This will permanently remove this review. This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 text-sm font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={loading}
                className="flex-1 py-2.5 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}