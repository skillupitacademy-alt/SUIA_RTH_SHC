/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '..', 'apps', 'api-server', '.env.local') });

const SOURCE_EMAIL = process.env.SOURCE_EMAIL ?? 'ajayshah@gmail.com';
const TARGET_PLATFORM = process.env.TARGET_PLATFORM ?? 'realtutorialhub';
const TARGET_SUBSCRIPTION_PLAN = process.env.TARGET_SUBSCRIPTION_PLAN ?? 'enterprise';
const TARGET_SUBSCRIPTION_FEATURES = (process.env.TARGET_SUBSCRIPTION_FEATURES ?? 'notes,exam')
  .split(',')
  .map((value) => value.trim())
  .filter((value) => value.length > 0);
const APPLY = process.env.APPLY === '1' || process.env.APPLY === 'true';

function assertConnectionString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} is missing. Set it in .env.local or the app/api-server env file.`);
  }
  return value;
}

function normalizeRoleName(roleName) {
  const value = typeof roleName === 'string' ? roleName.trim().toUpperCase() : '';
  if (value === 'SUPER_ADMIN' || value === 'INFRASTRUCTURE') return 'super_admin';
  if (value === 'ADMIN') return 'admin';
  if (value === 'FACULTY') return 'faculty';
  return 'student';
}

function mergeFeatures(existingFeatures, targetFeatures) {
  const merged = new Set(Array.isArray(existingFeatures) ? existingFeatures : []);
  for (const feature of targetFeatures) {
    merged.add(feature);
  }
  return [...merged];
}

async function loadUserFromOldDb(client, email) {
  const userResult = await client.query(
    `
      SELECT id, email, password_hash, email_verified, is_blocked, deleted_at, created_at, updated_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  const user = userResult.rows[0] ?? null;
  if (user === null) {
    return null;
  }

  const roleResult = await client.query(
    `
      SELECT DISTINCT r.name
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1
    `,
    [user.id],
  );

  const roleNames = roleResult.rows
    .map((row) => normalizeRoleName(row.name))
    .filter((value, index, self) => self.indexOf(value) === index);

  const derivedRole = roleNames.includes('super_admin')
    ? 'super_admin'
    : roleNames.includes('admin')
      ? 'admin'
      : roleNames.includes('faculty')
        ? 'faculty'
        : 'student';

  return {
    id: user.id,
    email: user.email,
    passwordHash: user.password_hash,
    isBlocked: user.is_blocked === true,
    deletedAt: user.deleted_at ?? null,
    emailVerified: user.email_verified === true,
    createdAt: user.created_at ?? null,
    updatedAt: user.updated_at ?? null,
    role: derivedRole,
    oldRoleNames: roleNames,
  };
}

async function loadUserFromPeopleDb(client, email) {
  const result = await client.query(
    `
      SELECT id, email, password_hash, role, platform, is_active, deleted_at, created_at, updated_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  return result.rows[0] ?? null;
}

async function ensurePlatformAccess(client, userId, platform) {
  await client.query(
    `
      INSERT INTO platform_access (user_id, platform, deleted_at)
      VALUES ($1, $2, NULL)
      ON CONFLICT (user_id, platform) DO UPDATE
      SET deleted_at = NULL
    `,
    [userId, platform],
  );
}

async function ensureSubscription(client, userId, features, planType) {
  const existingResult = await client.query(
    `
      SELECT id, features, plan_type, status
      FROM subscriptions
      WHERE user_id = $1
        AND status = 'active'
        AND deleted_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
    `,
    [userId],
  );

  const existing = existingResult.rows[0] ?? null;

  if (existing !== null) {
    const mergedFeatures = mergeFeatures(existing.features, features);
    await client.query(
      `
        UPDATE subscriptions
        SET
          features = $2,
          plan_type = $3,
          status = 'active',
          deleted_at = NULL
        WHERE id = $1
      `,
      [existing.id, mergedFeatures, planType],
    );
    return { action: 'updated', id: existing.id, features: mergedFeatures, planType };
  }

  const insertResult = await client.query(
    `
      INSERT INTO subscriptions (user_id, plan_type, features, status, started_at, expires_at, deleted_at)
      VALUES ($1, $2, $3, 'active', NOW(), NULL, NULL)
      RETURNING id
    `,
    [userId, planType, features],
  );

  return { action: 'created', id: insertResult.rows[0]?.id, features, planType };
}

async function upsertPeopleUser(client, legacyUser, existingPeopleUser) {
  const keepExistingRole = existingPeopleUser?.role ?? null;
  const keepExistingPlatform = existingPeopleUser?.platform ?? null;
  const targetRole = keepExistingRole ?? legacyUser.role;
  const targetPlatform = keepExistingPlatform ?? TARGET_PLATFORM;
  const isActive = legacyUser.isBlocked === false && legacyUser.deletedAt === null;

  if (existingPeopleUser !== null) {
    await client.query(
      `
        UPDATE users
        SET
          password_hash = $2,
          is_active = $3,
          deleted_at = $4,
          updated_at = NOW()
        WHERE id = $1
      `,
      [
        existingPeopleUser.id,
        legacyUser.passwordHash,
        isActive,
        null,
      ],
    );

    return {
      id: existingPeopleUser.id,
      email: existingPeopleUser.email,
      role: targetRole,
      platform: targetPlatform,
      mode: 'updated',
    };
  }

  const insertResult = await client.query(
    `
      INSERT INTO users (email, password_hash, role, platform, is_active, deleted_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, role, platform
    `,
    [
      legacyUser.email,
      legacyUser.passwordHash,
      targetRole,
      targetPlatform,
      isActive,
      null,
    ],
  );

  return {
    ...insertResult.rows[0],
    mode: 'inserted',
  };
}

async function main() {
  const oldDbUrl = assertConnectionString(process.env.DATABASE_URL, 'DATABASE_URL');
  const peopleDbUrl = assertConnectionString(process.env.DATABASE_URL_PEOPLE, 'DATABASE_URL_PEOPLE');

  const oldClient = new Client({ connectionString: oldDbUrl, ssl: { rejectUnauthorized: false } });
  const peopleClient = new Client({ connectionString: peopleDbUrl, ssl: { rejectUnauthorized: false } });

  await oldClient.connect();
  await peopleClient.connect();

  try {
    const legacyUser = await loadUserFromOldDb(oldClient, SOURCE_EMAIL);
    if (legacyUser === null) {
      throw new Error(`Legacy user not found in quiz DB: ${SOURCE_EMAIL}`);
    }

    const existingPeopleUser = await loadUserFromPeopleDb(peopleClient, SOURCE_EMAIL);
    const dryRunSummary = {
      sourceEmail: SOURCE_EMAIL,
      legacyUser: {
        id: legacyUser.id,
        email: legacyUser.email,
        role: legacyUser.role,
        passwordMatchesTesting: await bcrypt.compare('testing', legacyUser.passwordHash),
        oldRoleNames: legacyUser.oldRoleNames,
      },
      existingPeopleUser: existingPeopleUser
        ? {
            id: existingPeopleUser.id,
            email: existingPeopleUser.email,
            role: existingPeopleUser.role,
            platform: existingPeopleUser.platform,
            is_active: existingPeopleUser.is_active,
            deleted_at: existingPeopleUser.deleted_at,
          }
        : null,
      target: {
        platform: TARGET_PLATFORM,
        subscriptionPlan: TARGET_SUBSCRIPTION_PLAN,
        subscriptionFeatures: TARGET_SUBSCRIPTION_FEATURES,
      },
      mode: APPLY ? 'apply' : 'dry-run',
    };

    if (!APPLY) {
      console.log(JSON.stringify(dryRunSummary, null, 2));
      console.log('Dry run only. Re-run with APPLY=1 to write changes.');
      return;
    }

    await peopleClient.query('BEGIN');

    try {
      const mergedUser = await upsertPeopleUser(peopleClient, legacyUser, existingPeopleUser);
      await ensurePlatformAccess(peopleClient, mergedUser.id, TARGET_PLATFORM);
      const subscription = await ensureSubscription(peopleClient, mergedUser.id, TARGET_SUBSCRIPTION_FEATURES, TARGET_SUBSCRIPTION_PLAN);

      await peopleClient.query('COMMIT');

      console.log(JSON.stringify({
        ...dryRunSummary,
        result: {
          userMode: mergedUser.mode,
          userId: mergedUser.id,
          platformGranted: TARGET_PLATFORM,
          subscription,
        },
      }, null, 2));
    } catch (error) {
      await peopleClient.query('ROLLBACK');
      throw error;
    }
  } finally {
    await Promise.allSettled([
      oldClient.end(),
      peopleClient.end(),
    ]);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
