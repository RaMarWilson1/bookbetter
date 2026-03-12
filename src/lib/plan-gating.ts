// src/lib/plan-gating.ts
import { db } from '@/db';
import { tenants, staffAccounts, bookings } from '@/db/schema';
import { eq, and, gte, count } from 'drizzle-orm';
import { getPlanLimits, type PlanKey } from './stripe';

// Check if a feature is available on the tenant's plan
export function canUseFeature(plan: PlanKey, feature: keyof ReturnType<typeof getPlanLimits>): boolean {
  const limits = getPlanLimits(plan);
  return !!limits[feature];
}

// Check if tenant has hit their monthly booking limit
export async function canCreateBooking(tenantId: string, plan: PlanKey): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limits = getPlanLimits(plan);
  const limit = limits.bookingsPerMonth;

  if (limit === Infinity) return { allowed: true, current: 0, limit };

  // Count bookings this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [result] = await db
    .select({ count: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.tenantId, tenantId),
        gte(bookings.createdAt, startOfMonth)
      )
    );

  const current = result?.count || 0;
  return { allowed: current < limit, current, limit };
}

// Check if tenant can add more staff
export async function canAddStaff(tenantId: string, plan: PlanKey): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limits = getPlanLimits(plan);
  const limit = limits.maxStaff;

  const [result] = await db
    .select({ count: count() })
    .from(staffAccounts)
    .where(
      and(
        eq(staffAccounts.tenantId, tenantId),
        eq(staffAccounts.active, true)
      )
    );

  const current = result?.count || 0;

  // Business plan: base limit is 5, but they can pay for extra
  if (plan === 'business') {
    // For now, allow if under 5. Extra staff billing is handled separately.
    return { allowed: true, current, limit };
  }

  return { allowed: current < limit, current, limit };
}

// Check if tenant has SMS quota remaining
export function canSendSMS(smsUsed: number, smsQuota: number): boolean {
  return smsUsed < smsQuota;
}

// Get the SMS overage cost (for billing)
export const SMS_OVERAGE_RATE_CENTS = 1.5; // $0.015 per SMS

// Role permission checks
export type StaffRole = 'owner' | 'manager' | 'staff';

const PERMISSIONS = {
  'manage:billing': ['owner'],
  'manage:business': ['owner'],
  'manage:staff': ['owner', 'manager'],
  'manage:services': ['owner', 'manager'],
  'manage:settings': ['owner', 'manager'],
  'manage:branding': ['owner', 'manager'],
  'view:all-appointments': ['owner', 'manager'],
  'view:own-appointments': ['owner', 'manager', 'staff'],
  'manage:own-availability': ['owner', 'manager', 'staff'],
  'view:analytics': ['owner', 'manager'],
  'view:clients': ['owner', 'manager'],
  'respond:reviews': ['owner', 'manager'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: StaffRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

// Convenience: get all permissions for a role
export function getRolePermissions(role: StaffRole): Permission[] {
  return (Object.entries(PERMISSIONS) as [Permission, readonly string[]][])
    .filter(([, roles]) => roles.includes(role))
    .map(([permission]) => permission);
}

// Get a human-friendly upgrade message
export function getUpgradeMessage(feature: string, requiredPlan: PlanKey): string {
  const planNames: Record<PlanKey, string> = {
    starter: 'Starter',
    growth: 'Growth',
    business: 'Business',
  };
  return `${feature} is available on the ${planNames[requiredPlan]} plan and above.`;
}