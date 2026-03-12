// src/app/dashboard/settings/_components/stripe-connect-card.tsx
'use client';

import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';

interface StripeStatus {
  connected: boolean;
  onboardingComplete: boolean;
  accountId: string | null;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
}

export function StripeConnectCard() {
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchStatus();

    // Check URL params for callback messages
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe_connected') === 'true') {
      setMessage('Stripe account connected successfully!');
    } else if (params.get('stripe_pending') === 'true') {
      setMessage('Stripe setup isn\'t complete yet. Click below to finish.');
    } else if (params.get('stripe_refresh') === 'true') {
      setMessage('Your Stripe session expired. Click below to continue setup.');
    }
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/dashboard/stripe-connect');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      console.error('Failed to fetch Stripe status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/dashboard/stripe-connect', { method: 'POST' });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage('Failed to start Stripe setup. Please try again.');
        setConnecting(false);
      }
    } catch {
      setMessage('Something went wrong. Please try again.');
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          <span className="text-sm text-slate-500">Checking Stripe status...</span>
        </div>
      </div>
    );
  }

  const isConnected = status?.onboardingComplete;

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-6">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          isConnected ? 'bg-emerald-100' : 'bg-slate-100'
        }`}>
          <CreditCard className={`w-5 h-5 ${isConnected ? 'text-emerald-600' : 'text-slate-500'}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">Stripe Payments</h3>
          <p className="text-sm text-slate-500 mt-1">
            {isConnected
              ? 'Your Stripe account is connected. Client payments go directly to you.'
              : 'Connect your Stripe account to receive payments from bookings. Each team member connects their own account.'}
          </p>

          {message && (
            <div className={`mt-3 flex items-start gap-2 text-sm p-3 rounded-lg ${
              message.includes('success')
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {message.includes('success') ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              {message}
            </div>
          )}

          {isConnected ? (
            <div className="mt-4 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Connected
              </span>
              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 font-medium"
              >
                Open Stripe Dashboard
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Setting up...
                </>
              ) : status?.connected ? (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Finish Stripe Setup
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Connect Stripe Account
                </>
              )}
            </button>
          )}

          {!isConnected && (
            <p className="text-xs text-slate-400 mt-3">
              You&apos;ll be redirected to Stripe to complete setup. BookBetter never touches your money — payments go directly to your Stripe account.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}