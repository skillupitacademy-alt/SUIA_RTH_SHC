import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Try multiple possible database URLs
  const databaseUrl = process.env.SKILLHUBCORE_DATABASE_URL || 
                      process.env.DATABASE_URL_TUTORIAL;

  if (!databaseUrl) {
    console.error('❌ No database URL found for migrations');
    console.error('Please set one of these in your .env.local file:');
    console.error('1. SKILLHUBCORE_DATABASE_URL (for VPS PostgreSQL)');
    console.error('2. DATABASE_URL_TUTORIAL (for development on Neon)');
    console.error('');
    console.error('Example for VPS:');
    console.error('SKILLHUBCORE_DATABASE_URL="postgresql://user:password@vps-ip:5432/skillhubcore_db"');
    console.error('');
    console.error('Note: This will add 6 new tables to the existing database');
    process.exit(1);
  }

  console.log('Connecting to database...');
  console.log('Database URL:', databaseUrl.replace(/:[^:]*@/, ':****@'));

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    const db = drizzle(pool);
    
    console.log('Running migrations...');
    await migrate(db, {
      migrationsFolder: path.resolve(__dirname, '../../migrations'),
    });
    
    console.log('✅ Migrations completed successfully!');
    console.log('');
    console.log('📊 Tables created in existing SkillHubCore database:');
    console.log('  1. domains');
    console.log('  2. subjects');
    console.log('  3. topics');
    console.log('  4. subtopics');
    console.log('  5. skills');
    console.log('  6. topic_skills');
    console.log('');
    console.log('✅ Educational hierarchy tables added successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});