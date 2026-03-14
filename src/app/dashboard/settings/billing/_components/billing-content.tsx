// src/app/dashboard/settings/billing/_components/billing-content.tsx
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CreditCard,
  Check,
  Zap,
  Users,
  MessageSquare,
  BarChart3,
  Palette,
  Globe,
  Shield,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Tag,
  X,
} from 'lucide-react';

interface BillingContentProps {
  tenant: {
    id: string;
    name: string;
    plan: string;
    planStartedAt: Date | null;
    planEndsAt: Date | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    bookingsQuota: number;
    smsQuota: number;
    smsUsed: number;
  };
  usage: {
    bookingsThisMonth: number;
    activeStaff: number;
  };
  isOwner: boolean;
}

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    tagline: 'For new & solo pros',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      { icon: Zap, text: 'Up to 15 bookings/month' },
      { icon: Check, text: 'Directory listing' },
      { icon: Check, text: 'Email reminders' },
      { icon: Check, text: '.ics calendar sends' },
      { icon: BarChart3, text: 'Basic analytics' },
    ],
  },
  {
    key: 'growth',
    name: 'Growth',
    tagline: 'For active solo pros',
    monthlyPrice: 19,
    annualPrice: 15.83,
    popular: true,
    features: [
      { icon: Zap, text: 'Unlimited bookings' },
      { icon: CreditCard, text: 'Deposits & full pay at booking' },
      { icon: Users, text: 'Basic CRM' },
      { icon: MessageSquare, text: '50 SMS/month included' },
      { icon: Shield, text: 'Priority email support' },
      { icon: Check, text: 'Everything in Starter' },
    ],
  },
  {
    key: 'business',
    name: 'Business',
    tagline: 'For studios & shops',
    monthlyPrice: 79,
    annualPrice: 65.83,
    features: [
      { icon: Users, text: 'Up to 5 staff (+$10/mo extra)' },
      { icon: Check, text: 'Multi-staff calendars' },
      { icon: Shield, text: 'Roles & permissions' },
      { icon: BarChart3, text: 'Advanced analytics' },
      { icon: Palette, text: 'White-label branding' },
      { icon: Globe, text: 'Custom domain' },
      { icon: MessageSquare, text: '200 SMS/month included' },
      { icon: Sparkles, text: 'Branded emails & SMS' },
      { icon: Shield, text: 'Priority chat support' },
      { icon: Check, text: 'Everything in Growth' },
    ],
  },
];

export function BillingContent({ tenant, usage, isOwner }: BillingContentProps) {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [showCouponInput, setShowCouponInput] = useState(false);

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    setCouponApplied(couponCode.trim());
    setCouponError(null);
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponCode('');
    setCouponError(null);
  };

  const handleUpgrade = async (plan: string) => {
    if (!isOwner) return;
    setLoading(plan);
    setCouponError(null);

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          interval,
          ...(couponApplied ? { coupon: couponApplied } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.toLowerCase().includes('coupon')) {
          setCouponError(data.error);
          setCouponApplied(null);
        }
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // silently fail
    } finally {
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    if (!isOwner) return;
    setLoading('portal');

    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // silently fail
    } finally {
      setLoading(null);
    }
  };

  const currentPlan = PLANS.find((p) => p.key === tenant.plan) || PLANS[0];
  const bookingPercent = tenant.bookingsQuota > 0
    ? Math.min((usage.bookingsThisMonth / tenant.bookingsQuota) * 100, 100)
    : 0;

  const showFoundingProBanner = tenant.plan === 'starter' && isOwner;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Billing & Plans</h2>
        <p className="text-slate-500 mt-1">Manage your subscription and usage.</p>
      </div>

      {/* Success / Cancel Messages */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-900">Subscription activated!</p>
            <p className="text-xs text-emerald-700 mt-0.5">Your plan has been upgraded. New features are available now.</p>
          </div>
        </div>
      )}
      {canceled && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Zap className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-900">Checkout was canceled. No changes were made to your plan.</p>
        </div>
      )}

      {/* Founding Pro Promo Banner */}
      {showFoundingProBanner && (
        <div className="relative bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl p-5 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">Founding Pro Offer</span>
            </div>
            <h3 className="text-xl font-bold mb-1">Get 50% off for 6 months</h3>
            <p className="text-white/80 text-sm mb-3">
              Be an early adopter and lock in half-price on any paid plan. Limited time offer for founding professionals.
            </p>
            <button
              onClick={() => {
                setCouponCode('xelvaGO6');
                setCouponApplied('xelvaGO6');
                setCouponError(null);
                setShowCouponInput(true);
              }}
              className="px-4 py-2 bg-white text-violet-700 font-semibold text-sm rounded-lg hover:bg-white/90 transition-colors"
            >
              Apply Founding Pro Discount
            </button>
          </div>
        </div>
      )}

      {/* Current Plan & Usage */}
      <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-400" />
            <h3 className="font-semibold text-slate-900">Current Plan</h3>
          </div>
          {tenant.stripeSubscriptionId && isOwner && (
            <button
              onClick={handleManageBilling}
              disabled={loading === 'portal'}
              className="text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {loading === 'portal' ? 'Loading...' : 'Manage billing'}
            </button>
          )}
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              tenant.plan === 'business'
                ? 'bg-violet-100 text-violet-700'
                : tenant.plan === 'growth'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {currentPlan.name}
            </div>
            <span className="text-sm text-slate-500">{currentPlan.tagline}</span>
          </div>

          {/* Usage Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-slate-600">Bookings this month</span>
                <span className="font-medium text-slate-900">
                  {usage.bookingsThisMonth}{tenant.bookingsQuota < 999999 ? `/${tenant.bookingsQuota}` : ''}
                </span>
              </div>
              {tenant.bookingsQuota < 999999 && (
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      bookingPercent >= 90 ? 'bg-red-500' : bookingPercent >= 70 ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${bookingPercent}%` }}
                  />
                </div>
              )}
              {tenant.bookingsQuota >= 999999 && (
                <p className="text-xs text-emerald-600 font-medium">Unlimited</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-slate-600">Active staff</span>
                <span className="font-medium text-slate-900">{usage.activeStaff}</span>
              </div>
              <p className="text-xs text-slate-400">
                {tenant.plan === 'business' ? 'Up to 5 included' : 'Solo plan'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-slate-600">SMS used</span>
                <span className="font-medium text-slate-900">
                  {tenant.smsUsed}/{tenant.smsQuota}
                </span>
              </div>
              {tenant.smsQuota > 0 && (
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.min((tenant.smsUsed / tenant.smsQuota) * 100, 100)}%` }}
                  />
                </div>
              )}
              {tenant.smsQuota === 0 && (
                <p className="text-xs text-slate-400">Not included on this plan</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Not owner warning */}
      {!isOwner && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">Only the business owner can manage billing and change plans.</p>
        </div>
      )}

      {/* Plan Cards */}
      {isOwner && (
        <>
          {/* Interval Toggle */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setInterval('monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                interval === 'monthly'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('annual')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                interval === 'annual'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Annual
              <span className="ml-1.5 text-xs text-emerald-400 font-semibold">2 months free</span>
            </button>
          </div>

          {/* Coupon Code Section */}
          <div className="flex items-center justify-center">
            {!showCouponInput && !couponApplied && (
              <button
                onClick={() => setShowCouponInput(true)}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Tag className="w-3.5 h-3.5" />
                Have a promo code?
              </button>
            )}

            {showCouponInput && !couponApplied && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError(null);
                    }}
                    placeholder="Enter promo code"
                    className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-48"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleApplyCoupon();
                    }}
                  />
                </div>
                <button
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim()}
                  className="px-3 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Apply
                </button>
                <button
                  onClick={() => {
                    setShowCouponInput(false);
                    setCouponCode('');
                    setCouponError(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {couponApplied && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  {couponApplied}
                </span>
                <span className="text-xs text-emerald-600">applied</span>
                <button
                  onClick={handleRemoveCoupon}
                  className="ml-1 p-0.5 text-emerald-400 hover:text-emerald-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {couponError && (
            <p className="text-center text-sm text-red-500">{couponError}</p>
          )}

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const isCurrent = tenant.plan === plan.key;
              const isDowngrade =
                (tenant.plan === 'business' && plan.key !== 'business') ||
                (tenant.plan === 'growth' && plan.key === 'starter');
              const price = interval === 'annual' ? plan.annualPrice : plan.monthlyPrice;

              return (
                <div
                  key={plan.key}
                  className={`relative bg-white rounded-xl border-2 p-5 transition-all ${
                    isCurrent
                      ? 'border-blue-500 shadow-sm'
                      : plan.popular
                      ? 'border-slate-300 hover:border-slate-400'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {plan.popular && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full">
                      Popular
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                      Current Plan
                    </div>
                  )}

                  <div className="mb-4">
                    <h4 className="font-bold text-slate-900 text-lg">{plan.name}</h4>
                    <p className="text-xs text-slate-500">{plan.tagline}</p>
                  </div>

                  <div className="mb-4">
                    {price === 0 ? (
                      <span className="text-3xl font-bold text-slate-900">Free</span>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-slate-900">
                            ${interval === 'annual' ? price.toFixed(0) : price}
                          </span>
                          <span className="text-sm text-slate-500">/mo</span>
                        </div>
                        {couponApplied && (
                          <p className="text-xs text-violet-600 font-medium mt-0.5">
                            50% off for 6 months with coupon
                          </p>
                        )}
                      </div>
                    )}
                    {interval === 'annual' && price > 0 && (
                      <p className="text-xs text-emerald-600 mt-0.5">
                        Billed ${plan.key === 'growth' ? '190' : '790'}/year
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2 mb-5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <feature.icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 text-sm font-medium rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed"
                    >
                      Current plan
                    </button>
                  ) : isDowngrade ? (
                    <button
                      onClick={handleManageBilling}
                      disabled={!tenant.stripeSubscriptionId || loading === 'portal'}
                      className="w-full py-2.5 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      Downgrade
                    </button>
                  ) : plan.key === 'starter' ? (
                    <button
                      disabled
                      className="w-full py-2.5 text-sm font-medium rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed"
                    >
                      Free forever
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.key)}
                      disabled={loading === plan.key}
                      className={`w-full py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                        couponApplied
                          ? 'bg-violet-600 text-white hover:bg-violet-700'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {loading === plan.key ? 'Loading...' : couponApplied ? 'Upgrade with discount' : 'Upgrade'}
                      {loading !== plan.key && <ArrowRight className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Fine print */}
          <div className="text-xs text-slate-400 space-y-1">
            <p>SMS overage: $0.015/SMS after included allotment.</p>
            <p>Payment processing: pass-through Stripe fees only — no BookBetter markup.</p>
            <p>All plans include zero marketplace commissions.</p>
          </div>
        </>
      )}
    </div>
  );
}