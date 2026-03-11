// src/app/dashboard/settings/_components/cancellation-settings.tsx
'use client';

import { useState } from 'react';
import { Shield, Check, AlertTriangle } from 'lucide-react';

interface CancellationSettingsProps {
  tenantId: string;
  initialData: {
    cancellationWindowHours: number;
    lateCancellationFeeCents: number;
    cancellationPolicyText: string | null;
  };
}

const WINDOW_OPTIONS = [
  { value: 0, label: 'No free cancellation', desc: 'Fee applies to all cancellations' },
  { value: 2, label: '2 hours before', desc: 'Free if cancelled 2+ hours ahead' },
  { value: 6, label: '6 hours before', desc: 'Free if cancelled 6+ hours ahead' },
  { value: 12, label: '12 hours before', desc: 'Free if cancelled 12+ hours ahead' },
  { value: 24, label: '24 hours before', desc: 'Free if cancelled 24+ hours ahead' },
  { value: 48, label: '48 hours before', desc: 'Free if cancelled 48+ hours ahead' },
];

export function CancellationSettings({ tenantId, initialData }: CancellationSettingsProps) {
  const [windowHours, setWindowHours] = useState(initialData.cancellationWindowHours);
  const [feeCents, setFeeCents] = useState(initialData.lateCancellationFeeCents);
  const [feeDollars, setFeeDollars] = useState((initialData.lateCancellationFeeCents / 100).toFixed(2));
  const [policyText, setPolicyText] = useState(initialData.cancellationPolicyText || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleFeeChange = (value: string) => {
    setFeeDollars(value);
    const cents = Math.round(parseFloat(value || '0') * 100);
    setFeeCents(isNaN(cents) ? 0 : cents);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/dashboard/settings/cancellation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancellationWindowHours: windowHours,
          lateCancellationFeeCents: feeCents,
          cancellationPolicyText: policyText || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save');
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const formatPreview = () => {
    if (feeCents === 0) return 'Clients can cancel anytime for free.';
    if (windowHours === 0) return `A $${(feeCents / 100).toFixed(2)} fee applies to all cancellations.`;
    return `Free cancellation up to ${windowHours} hours before. After that, a $${(feeCents / 100).toFixed(2)} late cancellation fee applies.`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <Shield className="w-5 h-5 text-slate-400" />
        <h3 className="font-semibold text-slate-900">Cancellation Policy</h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Free Cancellation Window */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Free cancellation window
          </label>
          <div className="space-y-2">
            {WINDOW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setWindowHours(opt.value)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${
                  windowHours === opt.value
                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className={`font-medium ${windowHours === opt.value ? 'text-slate-900' : 'text-slate-700'}`}>
                  {opt.label}
                </span>
                <span className="text-slate-400 ml-2">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Late Cancellation Fee */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Late cancellation fee
          </label>
          <div className="relative w-40">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={feeDollars}
              onChange={(e) => handleFeeChange(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Charged when a client cancels within the cancellation window or is a no-show.
            {feeCents === 0 && ' Set to $0 for no fee.'}
          </p>
        </div>

        {/* Custom Policy Text */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Custom policy message <span className="text-slate-400">(optional)</span>
          </label>
          <textarea
            value={policyText}
            onChange={(e) => setPolicyText(e.target.value)}
            placeholder="e.g. Late cancellations will be charged a fee. No-shows may be blocked from future bookings."
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
          <p className="text-xs text-slate-400 mt-1">
            Shown to clients on the booking page and cancellation page.
          </p>
        </div>

        {/* Preview */}
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">What clients will see:</p>
              <p className="text-sm text-amber-700 mt-1">{formatPreview()}</p>
              {policyText && (
                <p className="text-sm text-amber-600 mt-1 italic">{policyText}</p>
              )}
            </div>
          </div>
        </div>

        {/* Error / Success */}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && (
          <p className="text-sm text-emerald-600 flex items-center gap-1">
            <Check className="w-4 h-4" />
            Cancellation policy saved!
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Policy'}
        </button>
      </div>
    </div>
  );
}