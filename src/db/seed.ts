// src/db/seed.ts
//
// Run with: npx dotenv -e .env.local -- npx tsx src/db/seed.ts
//
// Creates a test business owner account you can sign into.
// Uses your existing Google OAuth user if it exists,
// or creates a credentials-based user.
//

import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import { eq } from 'drizzle-orm';
import * as schema from './schema';
import * as bcrypt from 'bcryptjs';

const db = drizzle(sql, { schema });

// ═══════════════════════════════════════════════════════════
// ⚡ CONFIGURE THESE ⚡
// ═══════════════════════════════════════════════════════════

const SEED_EMAIL = 'ramarwilson1@gmail.com'; // Your email (Google OAuth or credentials)
const SEED_PASSWORD = 'TestAdmin123!';        // Only used if creating a new credentials user
const SEED_NAME = 'RaMar Wilson';

const BUSINESS_NAME = 'RaMar Cuts';
const BUSINESS_SLUG = 'ramar-cuts';
const BUSINESS_CATEGORY = null;
const BUSINESS_CITY = 'Philadelphia';
const BUSINESS_STATE = 'PA';
const BUSINESS_PHONE = '(215) 555-0100';
const BUSINESS_PLAN = 'business' as const; // 'starter' | 'growth' | 'business'

// ═══════════════════════════════════════════════════════════

async function seed() {
  console.log('🌱 Starting seed...\n');

  // 1. Find or create user
  let [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, SEED_EMAIL))
    .limit(1);

  if (user) {
    console.log(`✅ Found existing user: ${user.name} (${user.email})`);
    // Upgrade role to pro if needed
    if (user.role !== 'pro') {
      await db
        .update(schema.users)
        .set({ role: 'pro', updatedAt: new Date() })
        .where(eq(schema.users.id, user.id));
      console.log('   → Upgraded role to "pro"');
    }
  } else {
    const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);
    const [newUser] = await db
      .insert(schema.users)
      .values({
        name: SEED_NAME,
        email: SEED_EMAIL,
        password: hashedPassword,
        role: 'pro',
        timeZone: 'America/New_York',
      })
      .returning();
    user = newUser;
    console.log(`✅ Created user: ${user.name} (${user.email})`);
    console.log(`   → Password: ${SEED_PASSWORD}`);
  }

  // 2. Check if tenant already exists
  const [existingTenant] = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.slug, BUSINESS_SLUG))
    .limit(1);

  if (existingTenant) {
    console.log(`\n⚠️  Tenant "${BUSINESS_NAME}" already exists (slug: ${BUSINESS_SLUG})`);
    console.log('   Skipping tenant creation. Delete it first if you want to re-seed.\n');

    // Make sure staff account exists
    const [existingStaff] = await db
      .select()
      .from(schema.staffAccounts)
      .where(eq(schema.staffAccounts.userId, user.id))
      .limit(1);

    if (!existingStaff) {
      await db.insert(schema.staffAccounts).values({
        tenantId: existingTenant.id,
        userId: user.id,
        role: 'owner',
      });
      console.log('   → Created owner staff account');
    }

    console.log('\n🎉 Seed complete!');
    console.log(`   Sign in: ${SEED_EMAIL}`);
    console.log(`   Booking page: /book/${BUSINESS_SLUG}\n`);
    return;
  }

  // 3. Create tenant
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      name: BUSINESS_NAME,
      slug: BUSINESS_SLUG,
      categoryId: BUSINESS_CATEGORY,
      description: `Professional barber services by ${SEED_NAME}. Fresh cuts, beard trims, and more.`,
      email: SEED_EMAIL,
      phone: BUSINESS_PHONE,
      city: BUSINESS_CITY,
      state: BUSINESS_STATE,
      postalCode: '19103',
      country: 'US',
      timeZone: 'America/New_York',
      plan: BUSINESS_PLAN,
      bookingsQuota: BUSINESS_PLAN === 'starter' ? 15 : 999999,
      smsQuota: BUSINESS_PLAN === 'business' ? 200 : BUSINESS_PLAN === 'growth' ? 50 : 0,
      primaryColor: '#1A1A2E',
      secondaryColor: '#E94560',
      cancellationWindowHours: 24,
      lateCancellationFeeCents: 2500, // $25
      cancellationPolicyText: 'Please cancel at least 24 hours before your appointment to avoid a $25 late cancellation fee.',
    })
    .returning();

  console.log(`\n✅ Created tenant: ${tenant.name}`);
  console.log(`   Plan: ${BUSINESS_PLAN}`);
  console.log(`   Slug: ${tenant.slug}`);

  // 4. Create staff account (owner)
  await db.insert(schema.staffAccounts).values({
    tenantId: tenant.id,
    userId: user.id,
    role: 'owner',
  });
  console.log('✅ Created owner staff account');

  // 5. Create services
  const services = [
    { name: 'Classic Haircut', description: 'Clean cut with clippers and shears. Includes hot towel finish.', priceCents: 3500, durationMinutes: 30, sortOrder: 0 },
    { name: 'Beard Trim', description: 'Shape up and line your beard. Hot towel included.', priceCents: 2000, durationMinutes: 20, sortOrder: 1 },
    { name: 'Haircut + Beard Combo', description: 'Full haircut plus beard trim and shape. Our most popular service.', priceCents: 5000, durationMinutes: 45, sortOrder: 2 },
    { name: 'Kids Cut (12 & under)', description: 'Haircut for kids 12 and under. Patient and fun.', priceCents: 2500, durationMinutes: 25, sortOrder: 3 },
    { name: 'Line Up / Edge Up', description: 'Quick line up to keep your cut looking fresh between visits.', priceCents: 1500, durationMinutes: 15, sortOrder: 4 },
    { name: 'Hot Towel Shave', description: 'Traditional straight razor shave with hot towel treatment.', priceCents: 3000, durationMinutes: 30, sortOrder: 5 },
  ];

  for (const svc of services) {
    await db.insert(schema.services).values({
      tenantId: tenant.id,
      ...svc,
      active: true,
    });
  }
  console.log(`✅ Created ${services.length} services`);

  // 6. Create availability (Mon-Sat, 9am-6pm)
  const workDays = [1, 2, 3, 4, 5, 6]; // Mon=1 through Sat=6
  for (const day of workDays) {
    await db.insert(schema.availabilityTemplates).values({
      tenantId: tenant.id,
      staffId: null, // applies to all staff / the owner
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '18:00',
      active: true,
    });
  }
  console.log('✅ Created availability (Mon-Sat, 9AM-6PM)');

  // 7. Add a day-off exception (next Sunday as example)
  const nextSunday = new Date();
  nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
  nextSunday.setHours(0, 0, 0, 0);
  const nextSundayEnd = new Date(nextSunday);
  nextSundayEnd.setHours(23, 59, 59, 999);

  await db.insert(schema.availabilityExceptions).values({
    tenantId: tenant.id,
    staffId: null,
    startUtc: nextSunday,
    endUtc: nextSundayEnd,
    isBlocked: true,
    reason: 'Day off',
  });
  console.log('✅ Created availability exception (day off next Sunday)');

  // Done
  console.log('\n═══════════════════════════════════════');
  console.log('🎉 Seed complete!');
  console.log('═══════════════════════════════════════');
  console.log(`\n   Email:        ${SEED_EMAIL}`);
  console.log(`   Password:     ${SEED_PASSWORD} (if using credentials login)`);
  console.log(`   Business:     ${BUSINESS_NAME}`);
  console.log(`   Plan:         ${BUSINESS_PLAN}`);
  console.log(`   Dashboard:    /dashboard`);
  console.log(`   Booking page: /book/${BUSINESS_SLUG}`);
  console.log(`   Services:     ${services.length}`);
  console.log(`   Hours:        Mon-Sat 9AM-6PM\n`);
}

seed()
  .then(() => console.log('Done.'))
  .catch((err) => console.error('❌ Seed failed:', err))
  .finally(() => setTimeout(() => process.exit(0), 500));