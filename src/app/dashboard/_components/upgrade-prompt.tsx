// src/app/dashboard/_components/upgrade-prompt.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Zap, ArrowRight, AlertTriangle } from 'lucide-react';

interface UpgradePromptProps {
  type: 'warning' | 'limit';
  bookingsUsed: number;
  bookingsLimit: number;
  plan: string;
}

export function UpgradeBanner({ type, bookingsUsed, bookingsLimit, plan }: UpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (plan !== 'starter') return null;

  const percent = bookingsLimit > 0 ? Math.round((bookingsUsed / bookingsLimit) * 100) : 0;

  // Warning: show at 80%+
  if (type === 'warning' && percent < 80) return null;

  // Limit: show at 100%
  if (type === 'limit' && percent < 100) return null;

  const isAtLimit = percent >= 100;

  return (
    <div
      className={`rounded-xl p-4 flex items-start gap-3 ${
        isAtLimit
          ? 'bg-red-50 border border-red-200'
          : 'bg-amber-50 border border-amber-200'
      }`}
    >
      <div className={`shrink-0 mt-0.5 ${isAtLimit ? 'text-red-500' : 'text-amber-500'}`}>
        {isAtLimit ? <AlertTriangle className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isAtLimit ? 'text-red-900' : 'text-amber-900'}`}>
          {isAtLimit
            ? `You've reached your ${bookingsLimit} booking limit this month`
            : `You've used ${bookingsUsed} of ${bookingsLimit} bookings this month (${percent}%)`}
        </p>
        <p className={`text-xs mt-0.5 ${isAtLimit ? 'text-red-700' : 'text-amber-700'}`}>
          {isAtLimit
            ? 'New clients can\'t book you until next month. Upgrade to Growth for unlimited bookings.'
            : 'Getting close! Upgrade to Growth for unlimited bookings at $19/mo.'}
        </p>
        <Link
          href="/dashboard/settings/billing"
          className={`inline-flex items-center gap-1 text-xs font-semibold mt-2 ${
            isAtLimit
              ? 'text-red-700 hover:text-red-800'
              : 'text-amber-700 hover:text-amber-800'
          }`}
        >
          Upgrade now
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {!isAtLimit && (
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-600 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Modal version — shown on the booking page when limit is hit
export function BookingLimitModal({ businessName }: { businessName: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-xl">
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Bookings Unavailable</h2>
        <p className="text-sm text-gray-500 mb-6">
          {businessName} has reached their booking limit for this month. Please check back at the start of next month, or contact them directly to schedule.
        </p>
        <Link
          href="/search"
          className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          Find other professionals
        </Link>
      </div>
    </div>
  );
}