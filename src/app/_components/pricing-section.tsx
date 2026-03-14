// src/app/_components/pricing-section.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

const plans = [
  {
    key: 'starter',
    name: 'Starter',
    tagline: 'For new & solo pros',
    monthlyPrice: 0,
    annualPrice: 0,
    annualTotal: 0,
    features: [
      'Up to 15 bookings/month',
      'Directory listing',
      'Email reminders',
      'Basic analytics',
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
    features: [
      'Unlimited bookings',
      'Deposits & full pay at booking',
      'Basic CRM',
      '50 SMS/month included',
      'Priority email support',
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
    features: [
      'Everything in Growth',
      'Up to 5 staff (+$10/mo extra)',
      'Roles & permissions',
      'White-label branding',
      'Advanced analytics',
    ],
    cta: 'Start with Business',
    popular: false,
    dark: false,
  },
];

export function PricingSection() {
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly');

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
                  {plan.features.map((feature, i) => (
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
      </div>
    </section>
  );
}