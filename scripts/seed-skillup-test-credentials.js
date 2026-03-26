const fs = require('fs');
const path = require('path');

const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { Pool } = require('pg');

const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'apps/api-server/.env.local'),
  path.resolve(process.cwd(), 'apps/api-server/.env'),
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

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'https://api.realtutorialhub.com/api').trim().replace(/\/+$/, '');
const LOGIN_URL = `${API_BASE}/auth/login`;

const ACCOUNTS = [
  {
    email: 'student@skillupitacademy.com',
    password: 'SkillUp@2025',
    name: 'SkillUp Test Student',
    roles: ['USER', 'student'],
    expectedPortal: 'student',
  },
  {
    email: 'admin@skillupitacademy.com',
    password: 'SkillUpAdmin@2025',
    name: 'SkillUp Test Admin',
    roles: ['ADMIN', 'admin'],
    expectedPortal: 'admin',
  },
  {
    email: 'faculty@skillupitacademy.com',
    password: 'Faculty@2025',
    name: 'SkillUp Test Faculty',
    roles: ['USER', 'faculty'],
    expectedPortal: 'faculty',
  },
  {
    email: 'skillup_student@test.com',
    password: 'SkillUp@2024',
    name: 'SkillUp Student',
    roles: ['USER', 'student'],
    expectedPortal: 'student',
  },
  {
    email: 'skillup_admin@test.com',
    password: 'Admin@2024',
    name: 'SkillUp Admin',
    roles: ['ADMIN', 'admin'],
    expectedPortal: 'admin',
  },
  {
    email: 'faculty@test.com',
    password: 'Faculty@2024',
    name: 'SkillUp Faculty',
    roles: ['USER', 'faculty'],
    expectedPortal: 'faculty',
  },
  {
    email: 'student2@skillupitacademy.com',
    password: 'SkillUp@2025',
    name: 'SkillUp Demo Student 2',
    roles: ['USER', 'student'],
    expectedPortal: 'student',
  },
];

async function ensureRole(client, roleName) {
  const existing = await client.query('SELECT id FROM roles WHERE name = $1 LIMIT 1', [roleName]);
  if (existing.rowCount > 0) {
    return existing.rows[0].id;
  }

  const inserted = await client.query(
    'INSERT INTO roles (name) VALUES ($1) RETURNING id',
    [roleName],
  );
  return inserted.rows[0].id;
}

async function upsertUser(client, account, passwordHash) {
  const result = await client.query(
    `
      INSERT INTO users (email, password_hash, email_verified, is_blocked, deleted_at)
      VALUES ($1, $2, TRUE, FALSE, NULL)
      ON CONFLICT (email) DO UPDATE
      SET
        password_hash = EXCLUDED.password_hash,
        email_verified = TRUE,
        is_blocked = FALSE,
        deleted_at = NULL,
        updated_at = NOW()
      RETURNING id
    `,
    [account.email, passwordHash],
  );

  return result.rows[0].id;
}

async function upsertProfile(client, userId, name) {
  const updated = await client.query(
    `
      UPDATE user_profiles
      SET name = $2,
          updated_at = NOW()
      WHERE user_id = $1
    `,
    [userId, name],
  );

  if (updated.rowCount > 0) {
    return;
  }

  await client.query(
    `
      INSERT INTO user_profiles (user_id, name)
      VALUES ($1, $2)
    `,
    [userId, name],
  );
}

async function linkRole(client, userId, roleId) {
  await client.query(
    `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `,
    [userId, roleId],
  );
}

async function verifyLogin(account) {
  const response = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      email: account.email,
      password: account.password,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string' && payload.error) ||
      (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string' && payload.message) ||
      `Login verification failed for ${account.email}`;
    throw new Error(errorMessage);
  }

  return payload;
}

async function main() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await pool.query('SELECT 1');

    const roleNames = Array.from(new Set(ACCOUNTS.flatMap((account) => account.roles)));
    const roleIds = new Map();
    for (const roleName of roleNames) {
      roleIds.set(roleName, await ensureRole(pool, roleName));
    }

    const summary = [];
    for (const account of ACCOUNTS) {
      const passwordHash = await bcrypt.hash(account.password, 12);
      const userId = await upsertUser(pool, account, passwordHash);
      await upsertProfile(pool, userId, account.name);

      for (const roleName of account.roles) {
        const roleId = roleIds.get(roleName);
        if (typeof roleId !== 'string') {
          throw new Error(`Missing role id for ${roleName}`);
        }
        await linkRole(pool, userId, roleId);
      }

      summary.push({
        email: account.email,
        portal: account.expectedPortal,
        userId,
      });
    }

    for (const account of ACCOUNTS) {
      await verifyLogin(account);
    }

    console.log(JSON.stringify({
      ok: true,
      seeded: summary,
      verified: ACCOUNTS.map((account) => account.email),
    }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
