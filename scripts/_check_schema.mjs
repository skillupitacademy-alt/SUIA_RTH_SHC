import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({path:'.env.local'});
const c = new pg.Pool({connectionString: process.env.DATABASE_URL_TUTORIAL});
const r = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'tutorial_page_content_v2' ORDER BY ordinal_position");
console.log(r.rows.map(x=>x.column_name).join(', '));
await c.end();
