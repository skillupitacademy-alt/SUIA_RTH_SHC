import 'dotenv/config';
import pkg from 'pg';
const { Client } = pkg;

if (!process.env.DATABASE_URL_TUTORIAL) {
  console.error('DATABASE_URL_TUTORIAL not found');
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL_TUTORIAL,
  ssl: { rejectUnauthorized: false }
});

console.log('Connecting to TutorialDB...');
await client.connect();

const result = await client.query('SELECT * FROM tutorial_sidebar_trees_v2');

console.log('\nFound', result.rows.length, 'row(s) in tutorial_sidebar_trees_v2:\n');
console.log(JSON.stringify(result.rows, null, 2));

await client.end();
