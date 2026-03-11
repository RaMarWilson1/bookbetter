// src/app/cancel/[id]/_components/cancel-flow.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Shield,
} from 'lucide-react';

interface CancelFlowProps {
  bookingId: string;
}

interface BookingDetails {
  booking: {
    id: string;
    startUtc: string;
    endUtc: string;
    clientName: string;
    status: string;
  };
  businessName: string;
  policy: {
    windowHours: number;
    feeCents: number;
    policyText: string | null;
  };
  cancellationFee: number;
  isLateCancellation: boolean;
  hoursUntilAppointment: number;
}

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export function CancelFlow({ bookingId }: CancelFlowProps) {
  const [step, setStep] = useState<'email' | 'confirm' | 'done' | 'error'>('email');
  const [email, setEmail] = useState('');
  const [details, setDetails] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancelResult, setCancelResult] = useState<{ cancellationFee: number; isLateCancellation: boolean } | null>(null);

  const handleLookup = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/book/${bookingId}/cancel?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Booking not found');
        setLoading(false);
        return;
      }

      setDetails(data);
      setStep('confirm');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/book/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to cancel');
        setLoading(false);
        return;
      }

      setCancelResult({
        cancellationFee: data.cancellationFee,
        isLateCancellation: data.isLateCancellation,
      });
      setStep('done');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200/60">
        <div className="max-w-lg mx-auto px-4 py-4">
          <Link href="/" className="text-lg font-bold text-slate-900 tracking-tight">
            Book<span className="text-blue-500">Better</span>
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700 flex items-start gap-2">
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Step 1: Email Verification */}
        {step === 'email' && (
          <div>
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-7 h-7 text-slate-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Cancel Booking</h1>
              <p className="text-slate-500">Enter the email you used when booking to continue.</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/60 p-5">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Your email address
              </label>
              <div className="relative mb-4">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  placeholder="your@email.com"
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleLookup}
                disabled={!email.trim() || loading}
                className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Looking up...' : 'Find My Booking'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Confirm Cancellation */}
        {step === 'confirm' && details && (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Cancel Booking?</h1>
              <p className="text-slate-500">Review the details before cancelling.</p>
            </div>

            {/* Booking details */}
            <div className="bg-white rounded-xl border border-slate-200/60 divide-y divide-slate-100 mb-4">
              <div className="p-5">
                <p className="text-xs text-slate-400 font-medium mb-1">Appointment</p>
                <p className="text-slate-900 font-semibold">{details.businessName}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {formatDateTime(details.booking.startUtc)}
                </p>
              </div>

              <div className="p-5">
                <p className="text-xs text-slate-400 font-medium mb-1">Time until appointment</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-900 font-medium">
                    {details.hoursUntilAppointment < 1
                      ? `${Math.round(details.hoursUntilAppointment * 60)} minutes`
                      : `${Math.round(details.hoursUntilAppointment)} hours`}
                  </span>
                </div>
              </div>
            </div>

            {/* Cancellation fee warning */}
            {details.isLateCancellation && details.cancellationFee > 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-800 text-sm">Late cancellation fee</p>
                    <p className="text-sm text-amber-700 mt-1">
                      This appointment is within the {details.policy.windowHours}-hour cancellation window.
                      A fee of <span className="font-semibold">{formatPrice(details.cancellationFee)}</span> will apply.
                    </p>
                    {details.policy.policyText && (
                      <p className="text-sm text-amber-600 mt-2 italic">{details.policy.policyText}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : details.cancellationFee === 0 ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-emerald-800 text-sm">Free cancellation</p>
                    <p className="text-sm text-emerald-700 mt-0.5">
                      No fee will be charged for this cancellation.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => { setStep('email'); setDetails(null); setError(''); }}
                className="flex-1 py-2.5 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Cancelling...' : details.cancellationFee > 0
                  ? `Cancel & Pay ${formatPrice(details.cancellationFee)}`
                  : 'Confirm Cancellation'
                }
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 'done' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-slate-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Cancelled</h2>
            <p className="text-slate-500 mb-2">Your appointment has been cancelled.</p>
            {cancelResult?.isLateCancellation && cancelResult.cancellationFee > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium px-4 py-2 rounded-lg mb-4">
                <DollarSign className="w-4 h-4" />
                Cancellation fee: {formatPrice(cancelResult.cancellationFee)}
              </div>
            )}
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                Back to BookBetter
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}