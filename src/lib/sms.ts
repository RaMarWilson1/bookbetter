// src/lib/sms.ts
import { db } from '@/db';
import { tenants, notifications } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;
const OVERAGE_RATE_CENTS = 3; // $0.03 per SMS

interface SendSmsParams {
  to: string;
  body: string;
  tenantId: string;
  bookingId?: string;
  userId: string;
  purpose: string;
}

/**
 * Normalize phone to E.164 format (+1XXXXXXXXXX for US)
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

/**
 * Check if tenant has SMS credits available (quota + packs + overage).
 * Returns { allowed, source } where source is 'quota' | 'pack' | 'overage' | null
 */
async function checkSmsAllowance(tenantId: string): Promise<{
  allowed: boolean;
  source: 'quota' | 'pack' | 'overage' | null;
  tenant: {
    smsQuota: number | null;
    smsUsed: number | null;
    smsPackBalance: number | null;
    smsOverageEnabled: boolean | null;
    plan: string;
  } | null;
}> {
  const [tenant] = await db
    .select({
      smsQuota: tenants.smsQuota,
      smsUsed: tenants.smsUsed,
      smsPackBalance: tenants.smsPackBalance,
      smsOverageEnabled: tenants.smsOverageEnabled,
      plan: tenants.plan,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) return { allowed: false, source: null, tenant: null };

  // Starter plan: no SMS
  if (tenant.plan === 'starter') return { allowed: false, source: null, tenant };

  // Under monthly quota
  if ((tenant.smsUsed ?? 0) < (tenant.smsQuota ?? 0)) {
    return { allowed: true, source: 'quota', tenant };
  }

  // Has pack credits
  if ((tenant.smsPackBalance ?? 0) > 0) {
    return { allowed: true, source: 'pack', tenant };
  }

  // Overage enabled
  if (tenant.smsOverageEnabled) {
    return { allowed: true, source: 'overage', tenant };
  }

  return { allowed: false, source: null, tenant };
}

/**
 * Deduct one SMS credit from the appropriate source
 */
async function deductSmsCredit(tenantId: string, source: 'quota' | 'pack' | 'overage') {
  if (source === 'quota') {
    await db
      .update(tenants)
      .set({ smsUsed: sql`${tenants.smsUsed} + 1` })
      .where(eq(tenants.id, tenantId));
  } else if (source === 'pack') {
    // Deduct from pack, also increment smsUsed for tracking
    await db
      .update(tenants)
      .set({
        smsPackBalance: sql`${tenants.smsPackBalance} - 1`,
        smsUsed: sql`${tenants.smsUsed} + 1`,
      })
      .where(eq(tenants.id, tenantId));
  } else if (source === 'overage') {
    // Increment smsUsed (billing happens separately)
    await db
      .update(tenants)
      .set({ smsUsed: sql`${tenants.smsUsed} + 1` })
      .where(eq(tenants.id, tenantId));
    // TODO: Create a Stripe usage record for overage billing
    console.log(`[SMS] Overage SMS for tenant ${tenantId} — will charge $0.03`);
  }
}

/**
 * Send an SMS via Twilio with quota enforcement and logging.
 */
export async function sendSms({
  to,
  body,
  tenantId,
  bookingId,
  userId,
  purpose,
}: SendSmsParams): Promise<{ success: boolean; error?: string }> {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
    console.warn('[SMS] Twilio credentials not configured');
    return { success: false, error: 'SMS not configured' };
  }

  // Check allowance
  const { allowed, source } = await checkSmsAllowance(tenantId);
  if (!allowed) {
    console.warn(`[SMS] No SMS credits for tenant ${tenantId}`);
    // Log the blocked attempt
    await db.insert(notifications).values({
      userId,
      bookingId: bookingId || null,
      type: 'sms',
      purpose,
      recipient: to,
      status: 'blocked',
      errorMessage: 'No SMS credits available',
    });
    return { success: false, error: 'No SMS credits available' };
  }

  const toNormalized = normalizePhone(to);

  try {
    // Send via Twilio REST API
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: toNormalized,
          From: TWILIO_FROM,
          Body: body,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[SMS] Twilio error:', data);
      await db.insert(notifications).values({
        userId,
        bookingId: bookingId || null,
        type: 'sms',
        purpose,
        recipient: toNormalized,
        status: 'failed',
        errorMessage: data.message || 'Twilio error',
      });
      return { success: false, error: data.message || 'SMS send failed' };
    }

    // Deduct credit
    await deductSmsCredit(tenantId, source!);

    // Log success
    await db.insert(notifications).values({
      userId,
      bookingId: bookingId || null,
      type: 'sms',
      purpose,
      recipient: toNormalized,
      status: 'sent',
      externalId: data.sid,
    });

    console.log(`[SMS] Sent to ${toNormalized} (source: ${source}, sid: ${data.sid})`);
    return { success: true };
  } catch (err) {
    console.error('[SMS] Send error:', err);
    await db.insert(notifications).values({
      userId,
      bookingId: bookingId || null,
      type: 'sms',
      purpose,
      recipient: toNormalized,
      status: 'failed',
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
    });
    return { success: false, error: 'SMS send failed' };
  }
}

/**
 * Get SMS usage info for a tenant (for dashboard display)
 */
export async function getSmsUsage(tenantId: string) {
  const [tenant] = await db
    .select({
      plan: tenants.plan,
      smsQuota: tenants.smsQuota,
      smsUsed: tenants.smsUsed,
      smsPackBalance: tenants.smsPackBalance,
      smsOverageEnabled: tenants.smsOverageEnabled,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) return null;

  const quota = tenant.smsQuota ?? 0;
  const used = tenant.smsUsed ?? 0;
  const packBalance = tenant.smsPackBalance ?? 0;
  const remaining = Math.max(0, quota - used) + packBalance;
  const percentUsed = quota > 0 ? Math.round((used / quota) * 100) : 0;
  const atWarning = percentUsed >= 80;
  const atLimit = used >= quota && packBalance === 0 && !tenant.smsOverageEnabled;

  return {
    plan: tenant.plan,
    quota,
    used,
    packBalance,
    remaining,
    percentUsed,
    atWarning,
    atLimit,
    overageEnabled: tenant.smsOverageEnabled ?? false,
  };
}