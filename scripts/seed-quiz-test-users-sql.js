const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { Pool } = require('pg');

const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
if (typeof DATABASE_URL !== 'string' || DATABASE_URL.trim().length === 0) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const TEST_USERS = [
  {
    email: 'ajayshah@gmail.com',
    password: 'testing',
    name: 'Ajay Shah',
    roleName: 'USER',
  },
  {
    email: 'admin@test.com',
    password: 'admin123',
    name: 'Admin User',
    roleName: 'ADMIN',
  },
];

async function ensureRole(client, roleName) {
  const existing = await client.query('SELECT id FROM roles WHERE name = $1 LIMIT 1', [roleName]);
  if (existing.rowCount > 0) {
    console.log(`Role exists: ${roleName}`);
    return existing.rows[0].id;
  }

  console.log(`Creating role: ${roleName}`);
  const inserted = await client.query(
    'INSERT INTO roles (name) VALUES ($1) RETURNING id',
    [roleName],
  );
  return inserted.rows[0].id;
}

async function upsertUser(client, testUser, passwordHash) {
  const result = await client.query(
    `
      INSERT INTO users (email, password_hash, email_verified, is_blocked, deleted_at)
      VALUES ($1, $2, TRUE, FALSE, NULL)
      ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          email_verified = TRUE,
          is_blocked = FALSE,
          deleted_at = NULL
      RETURNING id
    `,
    [testUser.email, passwordHash],
  );

  const userId = result.rows[0].id;
  console.log(`User ${result.rowCount > 0 ? 'created/updated' : 'found'}: ${testUser.email} (${userId})`);

  // Upsert profile
  const profileCheck = await client.query(
    'SELECT id FROM user_profiles WHERE user_id = $1 LIMIT 1',
    [userId],
  );

  if (profileCheck.rowCount > 0) {
    await client.query(
      'UPDATE user_profiles SET name = $1 WHERE user_id = $2',
      [testUser.name, userId],
    );
  } else {
    await client.query(
      'INSERT INTO user_profiles (user_id, name) VALUES ($1, $2)',
      [userId, testUser.name],
    );
  }

  return userId;
}

async function assignRole(client, userId, roleId) {
  await client.query(
    `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, role_id) DO NOTHING
    `,
    [userId, roleId],
  );
}

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();

  try {
    console.log('Starting quiz test users seed...');

    for (const testUser of TEST_USERS) {
      console.log(`\nProcessing user: ${testUser.email}`);
      
      const passwordHash = await bcrypt.hash(testUser.password, 12);
      const userId = await upsertUser(client, testUser, passwordHash);
      
      const roleId = await ensureRole(client, testUser.roleName);
      await assignRole(client, userId, roleId);
      
      console.log(`✓ User ${testUser.email} ready with role ${testUser.roleName}`);
    }

    console.log('\n✓ Quiz test users seed complete');
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});
