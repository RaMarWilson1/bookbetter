// src/app/api/cron/sms-reset/route.ts
// Vercel Cron: runs daily at midnight to reset SMS quotas for tenants whose month rolled over
// Add to vercel.json: { "path": "/api/cron/sms-reset", "schedule": "0 0 * * *" }

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { or, eq, lte, isNull } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find Growth/Business tenants whose reset date has passed (or never set)
    const tenantsToReset = await db
      .select({ id: tenants.id, plan: tenants.plan })
      .from(tenants)
      .where(
        or(
          eq(tenants.plan, 'growth'),
          eq(tenants.plan, 'business')
        )
      );

    let reset = 0;

    for (const tenant of tenantsToReset) {
      // Check if reset is due
      const [full] = await db
        .select({ smsQuotaResetAt: tenants.smsQuotaResetAt })
        .from(tenants)
        .where(eq(tenants.id, tenant.id))
        .limit(1);

      const resetAt = full?.smsQuotaResetAt;
      const needsReset = !resetAt || resetAt <= now;

      if (needsReset) {
        const quota = tenant.plan === 'growth' ? 50 : 200;
        const nextReset = new Date(now);
        nextReset.setMonth(nextReset.getMonth() + 1);
        nextReset.setDate(1);
        nextReset.setHours(0, 0, 0, 0);

        await db
          .update(tenants)
          .set({
            smsQuota: quota,
            smsUsed: 0,
            smsQuotaResetAt: nextReset,
          })
          .where(eq(tenants.id, tenant.id));

        reset++;
      }
    }

    console.log(`[Cron/SMS-Reset] Reset ${reset} tenants`);
    return NextResponse.json({ reset });
  } catch (error) {
    console.error('[Cron/SMS-Reset] Error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}