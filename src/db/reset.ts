// src/db/reset.ts
//
// Run with: npx dotenv -e .env.local -- npx tsx src/db/reset.ts
//
// ⚠️  DESTRUCTIVE — Wipes all tenants, staff, services, bookings, etc.
// Then re-seeds with a fresh test business.
//

import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql as pgSql } from '@vercel/postgres';
import { sql } from 'drizzle-orm';

const db = drizzle(pgSql);

async function reset() {
  console.log('🗑️  Wiping all tenant data...\n');

  // Delete in order to respect foreign keys
  const tables = [
    'notifications',
    'reviews',
    'payment_intents',
    'bookings',
    'availability_exceptions',
    'availability_templates',
    'services',
    'staff_invites',
    'staff_accounts',
    'clients',
    'tenants',
  ];

  for (const table of tables) {
    try {
      await db.execute(sql.raw(`DELETE FROM "${table}"`));
      console.log(`   ✅ Cleared ${table}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Table might not exist yet if schema hasn't been pushed
      if (msg.includes('does not exist')) {
        console.log(`   ⏭️  Skipped ${table} (doesn't exist)`);
      } else {
        console.log(`   ⚠️  Error clearing ${table}: ${msg}`);
      }
    }
  }

  // Reset all users back to 'client' role
  await db.execute(sql.raw(`UPDATE "users" SET "role" = 'client', "updated_at" = NOW()`));
  console.log('   ✅ Reset all users to client role');

  console.log('\n🗑️  Wipe complete!\n');
  console.log('Now run the seed:');
  console.log('   npx dotenv -e .env.local -- npx tsx src/db/seed.ts\n');
}

reset()
  .then(() => console.log('Done.'))
  .catch((err) => console.error('❌ Reset failed:', err))
  .finally(() => setTimeout(() => process.exit(0), 500));