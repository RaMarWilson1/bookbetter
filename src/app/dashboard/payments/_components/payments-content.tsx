// src/app/dashboard/payments/_components/payments-content.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  DollarSign,
  CreditCard,
  Banknote,
  Trash2,
  X,
  Loader2,
  Search,
  ChevronDown,
  Download,
} from 'lucide-react';

interface Payment {
  id: string;
  amountCents: number;
  method: string;
  note: string | null;
  paidAt: string;
  bookingId: string | null;
  clientName: string | null;
  serviceName: string | null;
  createdAt: string;
}

interface Summary {
  grandTotalCents: number;
  byMethod: { method: string; totalCents: number; count: number }[];
  revenueByDay: { day: string; totalCents: number }[];
}

const METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'venmo', label: 'Venmo', icon: '💜' },
  { value: 'zelle', label: 'Zelle', icon: '💸' },
  { value: 'cashapp', label: 'Cash App', icon: '💚' },
  { value: 'stripe', label: 'Stripe', icon: '💳' },
  { value: 'other', label: 'Other', icon: '📝' },
];

const METHOD_COLORS: Record<string, string> = {
  stripe: 'bg-indigo-100 text-indigo-700',
  cash: 'bg-emerald-100 text-emerald-700',
  venmo: 'bg-purple-100 text-purple-700',
  zelle: 'bg-blue-100 text-blue-700',
  cashapp: 'bg-green-100 text-green-700',
  other: 'bg-slate-100 text-slate-700',
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function PaymentsContent() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [methodFilter, setMethodFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Log payment form
  const [logAmount, setLogAmount] = useState('');
  const [logMethod, setLogMethod] = useState('cash');
  const [logNote, setLogNote] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logSaving, setLogSaving] = useState(false);
  const [logError, setLogError] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (methodFilter) params.set('method', methodFilter);
      const res = await fetch(`/api/dashboard/payments?${params}`);
      const data = await res.json();
      setPayments(data.payments || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('[Payments] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [period, methodFilter]);

  const handleLogPayment = async () => {
    setLogError('');
    const amountCents = Math.round(parseFloat(logAmount) * 100);
    if (!logAmount || isNaN(amountCents) || amountCents <= 0) {
      setLogError('Enter a valid amount');
      return;
    }

    setLogSaving(true);
    try {
      const res = await fetch('/api/dashboard/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents,
          method: logMethod,
          note: logNote || null,
          paidAt: new Date(logDate + 'T12:00:00').toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setLogError(data.error || 'Failed to log payment');
        return;
      }

      // Reset form and refresh
      setLogAmount('');
      setLogMethod('cash');
      setLogNote('');
      setLogDate(new Date().toISOString().split('T')[0]);
      setShowModal(false);
      fetchPayments();
    } catch {
      setLogError('Something went wrong');
    } finally {
      setLogSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payment entry?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/dashboard/payments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPayments();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch {
      alert('Something went wrong');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="text-sm text-slate-500 mt-1">Track revenue from all sources</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const now = new Date();
              const from = `${now.getFullYear()}-01-01`;
              const to = now.toISOString().split('T')[0];
              window.open(`/api/dashboard/payments/export?from=${from}&to=${to}`, '_blank');
            }}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log Payment
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {formatPrice(summary.grandTotalCents)}
            </p>
            <p className="text-sm text-slate-500">Total this {period}</p>
          </div>
          {summary.byMethod.slice(0, 3).map((m) => {
            const opt = METHOD_OPTIONS.find((o) => o.value === m.method);
            return (
              <div key={m.method} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{opt?.icon || '📝'}</span>
                  <span className="text-xs font-medium text-slate-500 capitalize">{m.method}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{formatPrice(m.totalCents)}</p>
                <p className="text-sm text-slate-500">{m.count} payment{m.count !== 1 ? 's' : ''}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
          {['week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                period === p
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700"
        >
          <option value="">All methods</option>
          {METHOD_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.icon} {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Payments list */}
      <div className="bg-white rounded-xl border border-slate-200">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading payments...
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Banknote className="w-6 h-6 text-slate-400" />
            </div>
            <p className="font-medium text-slate-700 mb-1">No payments yet</p>
            <p className="text-sm text-slate-500 mb-4">
              Log your first payment to start tracking revenue
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Log Payment
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_100px_100px_120px_40px] gap-4 px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <span>Details</span>
              <span>Method</span>
              <span className="text-right">Amount</span>
              <span>Date</span>
              <span />
            </div>
            {payments.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_100px_100px_120px_40px] gap-4 px-5 py-3.5 items-center hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {p.clientName || p.note || 'Manual payment'}
                  </p>
                  {p.serviceName && (
                    <p className="text-xs text-slate-500 truncate">{p.serviceName}</p>
                  )}
                  {p.note && p.clientName && (
                    <p className="text-xs text-slate-400 truncate">{p.note}</p>
                  )}
                </div>
                <div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      METHOD_COLORS[p.method] || METHOD_COLORS.other
                    }`}
                  >
                    {p.method}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900 text-right">
                  {formatPrice(p.amountCents)}
                </p>
                <p className="text-xs text-slate-500">{formatDateTime(p.paidAt)}</p>
                <div>
                  {p.method !== 'stripe' && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deleting === p.id}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Log a payment</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {logError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{logError}</p>
            )}

            <div className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={logAmount}
                    onChange={(e) => setLogAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* Method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment method</label>
                <div className="grid grid-cols-3 gap-2">
                  {METHOD_OPTIONS.filter((m) => m.value !== 'stripe').map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setLogMethod(m.value)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                        logMethod === m.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span>{m.icon}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Note <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  placeholder="e.g. Haircut for John, tip included"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogPayment}
                disabled={logSaving || !logAmount}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {logSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Log Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}