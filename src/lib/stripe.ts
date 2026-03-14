// src/lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

// ─── Plan Definitions ───────────────────────────────────────────────
// Price IDs are set via env vars — create these in Stripe Dashboard first.
// Each paid plan needs a monthly AND annual price in Stripe's Product Catalog.

export const PLANS = {
  starter: {
    name: 'Starter',
    description: 'For new & solo pros testing the waters',
    monthlyPrice: 0,
    annualPrice: 0,
    stripePriceIdMonthly: null,
    stripePriceIdAnnual: null,
    limits: {
      bookingsPerMonth: 15,
      maxStaff: 1,
      maxServices: 5,
      smsPerMonth: 0,
      branding: false,
      whiteLabel: false,
      customDomain: false,
      brandedComms: false,
      deposits: false,
      crm: false,
      advancedAnalytics: false,
      rolesPermissions: false,
      customCancellationPolicy: false,
      priorityEmail: false,
      priorityChat: false,
      respondToReviews: false,
      removeReviews: false,
    },
  },
  growth: {
    name: 'Growth',
    description: 'For active solo professionals',
    monthlyPrice: 1900,
    annualPrice: 19000,  // $190/yr (2 months free)
    stripePriceIdMonthly: process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID || null,
    stripePriceIdAnnual: process.env.STRIPE_GROWTH_ANNUAL_PRICE_ID || null,
    limits: {
      bookingsPerMonth: Infinity,
      maxStaff: 1,
      maxServices: Infinity,
      smsPerMonth: 50,
      branding: false,
      whiteLabel: false,
      customDomain: false,
      brandedComms: false,
      deposits: true,
      crm: true,
      advancedAnalytics: false,
      rolesPermissions: false,
      customCancellationPolicy: true,
      priorityEmail: true,
      priorityChat: false,
      respondToReviews: true,
      removeReviews: true,
    },
  },
  business: {
    name: 'Business',
    description: 'For studios & shops with teams',
    monthlyPrice: 7900,
    annualPrice: 79000,  // $790/yr (2 months free)
    stripePriceIdMonthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || null,
    stripePriceIdAnnual: process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID || null,
    limits: {
      bookingsPerMonth: Infinity,
      maxStaff: 5,           // +$10/mo per extra staff beyond 5
      maxServices: Infinity,
      smsPerMonth: 200,
      branding: true,
      whiteLabel: true,
      customDomain: true,
      brandedComms: true,
      deposits: true,
      crm: true,
      advancedAnalytics: true,
      rolesPermissions: true,
      customCancellationPolicy: true,
      priorityEmail: true,
      priorityChat: true,
      respondToReviews: true,
      removeReviews: true,
    },
    extraStaffPriceMonthly: 1000, // $10/mo per extra staff beyond 5
    extraStaffPriceIdMonthly: process.env.STRIPE_EXTRA_STAFF_MONTHLY_PRICE_ID || null,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
export type PlanLimitKey = keyof typeof PLANS.starter.limits;

// Founding Pro offer
export const FOUNDING_PRO_COUPON_ID = process.env.STRIPE_FOUNDING_PRO_COUPON_ID || '';
export const FOUNDING_PRO_MAX = 100;

// SMS overage rate
export const SMS_OVERAGE_RATE_CENTS = 1.5; // $0.015 per SMS

export function getPlanConfig(plan: string) {
  return PLANS[plan as PlanKey] || PLANS.starter;
}

export function getPlanLimits(plan: string) {
  return getPlanConfig(plan).limits;
}

export function canAccess(tenantPlan: string, feature: PlanLimitKey): boolean {
  const limits = getPlanLimits(tenantPlan);
  const value = limits[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  return false;
}

export function isAtBookingLimit(tenantPlan: string, currentMonthBookings: number): boolean {
  const limits = getPlanLimits(tenantPlan);
  return limits.bookingsPerMonth !== Infinity && currentMonthBookings >= limits.bookingsPerMonth;
}

export function canAddStaff(tenantPlan: string, currentStaffCount: number): boolean {
  if (tenantPlan === 'business') return true;
  const limits = getPlanLimits(tenantPlan);
  return currentStaffCount < limits.maxStaff;
}

export function canAddService(tenantPlan: string, currentServiceCount: number): boolean {
  const limits = getPlanLimits(tenantPlan);
  return limits.maxServices === Infinity || currentServiceCount < limits.maxServices;
}

export function getPriceId(plan: PlanKey, interval: 'monthly' | 'annual'): string | null {
  const config = PLANS[plan];
  return interval === 'annual' ? config.stripePriceIdAnnual : config.stripePriceIdMonthly;
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}