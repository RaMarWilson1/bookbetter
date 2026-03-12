// src/lib/staff-billing.ts
//
// Syncs the extra-staff add-on line item on a tenant's Stripe subscription.
// Business plan includes 5 staff. Each additional active staff member is $10/mo.
// Called after a staff member is added or removed.

import { db } from '@/db';
import { staffAccounts, tenants } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';

const INCLUDED_STAFF = 5;
const EXTRA_STAFF_PRICE_ID = process.env.STRIPE_EXTRA_STAFF_MONTHLY_PRICE_ID || '';

/**
 * Recalculates and updates the extra staff line item on the tenant's subscription.
 * - If extra staff > 0 and no line item exists → adds it
 * - If extra staff > 0 and line item exists → updates quantity
 * - If extra staff = 0 and line item exists → removes it
 * - If no subscription or not on Business plan → does nothing
 */
export async function syncExtraStaffBilling(tenantId: string): Promise<void> {
  if (!EXTRA_STAFF_PRICE_ID) {
    // Price not configured — skip billing sync
    console.warn('[Staff Billing] STRIPE_EXTRA_STAFF_MONTHLY_PRICE_ID not set, skipping');
    return;
  }

  try {
    // Get tenant subscription info
    const [tenant] = await db
      .select({
        plan: tenants.plan,
        stripeSubscriptionId: tenants.stripeSubscriptionId,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant || tenant.plan !== 'business' || !tenant.stripeSubscriptionId) {
      return; // Only Business plan with an active subscription
    }

    // Count active staff
    const [staffCount] = await db
      .select({ count: count() })
      .from(staffAccounts)
      .where(
        and(
          eq(staffAccounts.tenantId, tenantId),
          eq(staffAccounts.active, true)
        )
      );

    const totalStaff = staffCount?.count || 0;
    const extraStaff = Math.max(0, totalStaff - INCLUDED_STAFF);

    // Get the current subscription
    const subscription = await stripe.subscriptions.retrieve(
      tenant.stripeSubscriptionId
    );

    // Find existing extra staff line item
    const existingItem = subscription.items.data.find(
      (item) => item.price.id === EXTRA_STAFF_PRICE_ID
    );

    if (extraStaff > 0 && existingItem) {
      // Update quantity
      if (existingItem.quantity !== extraStaff) {
        await stripe.subscriptionItems.update(existingItem.id, {
          quantity: extraStaff,
        });
        console.log(
          `[Staff Billing] Updated extra staff to ${extraStaff} for tenant ${tenantId}`
        );
      }
    } else if (extraStaff > 0 && !existingItem) {
      // Add the extra staff line item
      await stripe.subscriptionItems.create({
        subscription: tenant.stripeSubscriptionId,
        price: EXTRA_STAFF_PRICE_ID,
        quantity: extraStaff,
      });
      console.log(
        `[Staff Billing] Added ${extraStaff} extra staff for tenant ${tenantId}`
      );
    } else if (extraStaff === 0 && existingItem) {
      // Remove the line item — no extra staff needed
      await stripe.subscriptionItems.del(existingItem.id, {
        proration_behavior: 'create_prorations',
      });
      console.log(
        `[Staff Billing] Removed extra staff line item for tenant ${tenantId}`
      );
    }
    // If extraStaff === 0 && !existingItem → nothing to do
  } catch (error) {
    // Log but don't throw — billing sync failure shouldn't block the invite flow
    console.error('[Staff Billing] Error syncing extra staff:', error);
  }
}