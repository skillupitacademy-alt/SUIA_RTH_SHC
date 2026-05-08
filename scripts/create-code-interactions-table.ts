import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_DIRECT_URL_TUTORIAL || '');

async function createCodeInteractionsTable() {
  console.log('🚀 Creating code_interactions table...\n');
  
  try {
    // Create table
    await sql`
      CREATE TABLE IF NOT EXISTS code_interactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        user_id uuid NOT NULL,
        section_id uuid NOT NULL,
        code_example_id text NOT NULL,
        user_code text NOT NULL,
        executed boolean DEFAULT false NOT NULL,
        execution_result jsonb,
        time_spent integer DEFAULT 0 NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log('✅ Table created');
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_code_interactions_user ON code_interactions (user_id);`;
    console.log('✅ Index idx_code_interactions_user created');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_code_interactions_section ON code_interactions (section_id);`;
    console.log('✅ Index idx_code_interactions_section created');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_code_interactions_example ON code_interactions (code_example_id);`;
    console.log('✅ Index idx_code_interactions_example created');
    
    // Add foreign key
    await sql`
      ALTER TABLE code_interactions 
      ADD CONSTRAINT code_interactions_section_id_tutorial_sections_id_fk 
      FOREIGN KEY (section_id) REFERENCES tutorial_sections(id) 
      ON DELETE cascade;
    `;
    console.log('✅ Foreign key constraint added');
    
    console.log('\n✅ code_interactions table created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

createCodeInteractionsTable();
