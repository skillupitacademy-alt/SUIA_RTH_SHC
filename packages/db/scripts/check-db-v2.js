const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
dotenv.config();

async function checkTypes() {
    const sql = neon(process.env.DATABASE_URL);
    try {
        const types = await sql`
      SELECT n.nspname as schema, t.typname as type 
      FROM pg_type t 
      LEFT JOIN pg_namespace n ON n.oid = t.typnamespace 
      WHERE (n.nspname = 'public') AND (t.typtype = 'e')
    `;
        console.log('Existing Enums:', types.map(t => t.type));

        const migrations = await sql`SELECT * FROM "__drizzle_migrations"`;
        console.log('Applied Migrations count:', migrations.length);
        console.log('Migrations:', migrations);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

checkTypes();
