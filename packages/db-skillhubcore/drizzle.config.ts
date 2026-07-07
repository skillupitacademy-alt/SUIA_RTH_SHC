import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env.local' });

// For development: Use DATABASE_URL_TUTORIAL (Neon)
// For production: Use actual VPS PostgreSQL connection
const databaseUrl = process.env.SKILLHUBCORE_DATABASE_URL || 
                    process.env.DATABASE_URL_TUTORIAL || 
                    '';

if (!databaseUrl) {
  console.error('❌ No database URL found for drizzle-kit');
  console.error('Please set either:');
  console.error('1. SKILLHUBCORE_DATABASE_URL (for VPS PostgreSQL)');
  console.error('2. DATABASE_URL_TUTORIAL (for development on Neon)');
  process.exit(1);
}

console.log('✅ Using database:', databaseUrl.replace(/:[^:]*@/, ':****@'));

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/*.ts',
  out: './migrations',
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
});