import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_DIRECT_URL_TUTORIAL || '');

async function applyMigration() {
  console.log('🚀 Applying User Interactions Migration...\n');
  
  try {
    // Read the migration file
    const migrationPath = path.resolve(process.cwd(), 'packages/db-tutorial/migrations/0012_user_interactions_only.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    // Split by statement breakpoint and execute each statement
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await sql([statement] as any);
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        } catch (error: any) {
          // Ignore "already exists" errors
          if (error.message?.includes('already exists')) {
            console.log(`⚠️  Statement ${i + 1}/${statements.length} skipped (already exists)`);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Migration applied successfully!\n');
    
    // Verify tables were created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('quiz_answers', 'practice_test_answers', 'code_interactions', 'visual_interactions', 'section_completions')
      ORDER BY table_name;
    `;
    
    console.log(`✅ Verified ${tables.length} new tables created:`);
    tables.forEach((row: any) => {
      console.log(`   - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
applyMigration();
