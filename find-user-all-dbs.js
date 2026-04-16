const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function findUserInAllDbs() {
  const email = 'ajayshah@gmail.com';
  
  const databases = [
    { name: 'Main/Quiz', url: process.env.DATABASE_DIRECT_URL },
    { name: 'RTH', url: process.env.DATABASE_DIRECT_URL_RTH },
    { name: 'SkillUp', url: process.env.DATABASE_DIRECT_URL_SKILLUP },
  ];

  for (const db of databases) {
    console.log(`\n🔍 Checking ${db.name} database...`);
    
    if (!db.url) {
      console.log(`❌ No connection string for ${db.name}`);
      continue;
    }

    const client = new Client({ connectionString: db.url });

    try {
      await client.connect();
      
      const userQuery = `
        SELECT id, email, is_blocked, email_verified, created_at
        FROM users 
        WHERE email = $1
      `;
      
      const result = await client.query(userQuery, [email]);
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        console.log(`✅ User FOUND in ${db.name}:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Blocked: ${user.is_blocked}`);
        console.log(`   Verified: ${user.email_verified}`);
        console.log(`   Created: ${user.created_at}`);
      } else {
        console.log(`❌ User NOT found in ${db.name}`);
      }

    } catch (error) {
      console.log(`❌ Error connecting to ${db.name}: ${error.message}`);
    } finally {
      await client.end();
    }
  }
}

findUserInAllDbs();