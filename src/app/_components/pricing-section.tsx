// src/app/_components/pricing-section.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X } from 'lucide-react';

interface Feature {
  label: string;
  starter: boolean | string;
  growth: boolean | string;
  business: boolean | string;
}

const features: Feature[] = [
  { label: 'Bookings per month', starter: 'Up to 15', growth: 'Unlimited', business: 'Unlimited' },
  { label: 'Staff accounts', starter: 'Solo only', growth: 'Solo only', business: 'Up to 5 (+$10/mo each)' },
  { label: 'Payments & deposits', starter: true, growth: true, business: true },
  { label: 'Directory listing', starter: true, growth: true, business: true },
  { label: 'Booking page customization', starter: true, growth: true, business: true },
  { label: 'Reschedule proposals', starter: true, growth: true, business: true },
  { label: 'SMS reminders', starter: false, growth: '50/month', business: '200/month' },
  { label: 'Respond to reviews', starter: false, growth: true, business: true },
  { label: 'Hide/remove reviews', starter: false, growth: '10/month', business: '10/month' },
  { label: 'Remove "Powered by" badge', starter: false, growth: true, business: true },
  { label: 'Advanced analytics', starter: false, growth: true, business: true },
  { label: 'Roles & permissions', starter: false, growth: false, business: true },
];

const plans = [
  {
    key: 'starter',
    name: 'Starter',
    tagline: 'For new & solo pros',
    monthlyPrice: 0,
    annualPrice: 0,
    annualTotal: 0,
    highlights: [
      'Up to 15 bookings/month',
      'Payments & deposits',
      'Directory listing',
      'Booking page customization',
    ],
    cta: 'Get started free',
    popular: false,
    dark: false,
  },
  {
    key: 'growth',
    name: 'Growth',
    tagline: 'For active solo pros',
    monthlyPrice: 19,
    annualPrice: 15.83,
    annualTotal: 190,
    highlights: [
      'Unlimited bookings',
      '50 SMS reminders/month',
      'Respond to & moderate reviews',
      'Remove "Powered by" badge',
      'Advanced analytics',
    ],
    cta: 'Start with Growth',
    popular: true,
    dark: true,
  },
  {
    key: 'business',
    name: 'Business',
    tagline: 'For studios & shops',
    monthlyPrice: 79,
    annualPrice: 65.83,
    annualTotal: 790,
    highlights: [
      'Everything in Growth',
      'Up to 5 staff (+$10/mo each)',
      '200 SMS reminders/month',
      'Roles & permissions',
    ],
    cta: 'Start with Business',
    popular: false,
    dark: false,
  },
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-4 h-4 text-emerald-500" />;
  if (value === false) return <X className="w-4 h-4 text-slate-300" />;
  return <span className="text-sm text-slate-700 font-medium">{value}</span>;
}

export function PricingSection() {
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly');
  const [showComparison, setShowComparison] = useState(false);

  return (
    <section id="pricing" className="bg-gray-50 py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-blue-500 tracking-wide uppercase mb-3">Pricing</p>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, honest pricing
          </h2>
          <p className="text-lg text-gray-500">
            No commissions. No hidden fees. No markup on payment processing.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <button
            onClick={() => setInterval('monthly')}
            className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              interval === 'monthly'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('annual')}
            className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              interval === 'annual'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}
          >
            Annual
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              interval === 'annual'
                ? 'bg-emerald-400 text-white'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              Save 17%
            </span>
          </button>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const price = interval === 'annual' ? plan.annualPrice : plan.monthlyPrice;
            const isFree = plan.monthlyPrice === 0;

            return (
              <div
                key={plan.key}
                className={`bg-white rounded-2xl p-8 relative ${
                  plan.popular
                    ? 'border-2 border-gray-900'
                    : 'border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full">
                    Popular
                  </div>
                )}

                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.tagline}</p>

                <div className="mt-6 mb-6">
                  {isFree ? (
                    <span className="text-4xl font-bold text-gray-900">Free</span>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-gray-900">
                          ${interval === 'annual' ? Math.round(price) : price}
                        </span>
                        <span className="text-gray-500 text-sm">/month</span>
                      </div>
                      {interval === 'annual' && (
                        <p className="text-xs text-emerald-600 font-medium mt-1">
                          Billed ${plan.annualTotal}/year · saves ${(plan.monthlyPrice * 12) - plan.annualTotal}/yr
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <ul className="space-y-3 text-sm text-gray-600 mb-8">
                  {plan.highlights.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/sign-up"
                  className={`block text-center w-full py-3 text-sm font-semibold rounded-lg transition-colors ${
                    plan.dark
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'border-2 border-gray-200 text-gray-900 hover:border-gray-400'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          No marketplace commissions. Pass-through Stripe fees only.
        </p>

        {/* Compare all features toggle */}
        <div className="text-center mt-8">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            {showComparison ? 'Hide full comparison' : 'Compare all features'}
          </button>
        </div>

        {/* Feature comparison table */}
        {showComparison && (
          <div className="mt-8 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-sm font-medium text-gray-500 py-4 px-6 w-1/3">Feature</th>
                    <th className="text-center text-sm font-bold text-gray-900 py-4 px-4">Starter</th>
                    <th className="text-center text-sm font-bold text-gray-900 py-4 px-4 bg-blue-50/50">Growth</th>
                    <th className="text-center text-sm font-bold text-gray-900 py-4 px-4">Business</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, i) => (
                    <tr key={i} className={i < features.length - 1 ? 'border-b border-gray-50' : ''}>
                      <td className="text-sm text-gray-700 py-3.5 px-6">{feature.label}</td>
                      <td className="text-center py-3.5 px-4">
                        <div className="flex justify-center">
                          <FeatureValue value={feature.starter} />
                        </div>
                      </td>
                      <td className="text-center py-3.5 px-4 bg-blue-50/50">
                        <div className="flex justify-center">
                          <FeatureValue value={feature.growth} />
                        </div>
                      </td>
                      <td className="text-center py-3.5 px-4">
                        <div className="flex justify-center">
                          <FeatureValue value={feature.business} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}