const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
dotenv.config();

async function checkEnumValues() {
    const sql = neon(process.env.DATABASE_URL);
    try {
        const values = await sql`
      SELECT e.enumlabel
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'exam_status'
    `;
        console.log('Exam Status Values:', values.map(v => v.enumlabel));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

checkEnumValues();
