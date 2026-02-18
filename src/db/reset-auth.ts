import { sql } from '@vercel/postgres';

async function resetAuthTables() {
  console.log('Dropping auth tables...');
  
  await sql`DROP TABLE IF EXISTS sessions CASCADE`;
  await sql`DROP TABLE IF EXISTS accounts CASCADE`;
  await sql`DROP TABLE IF EXISTS verification_tokens CASCADE`;
  
  console.log('Done! Now run: npm run db:push');
}

resetAuthTables().catch(console.error);
