import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

type Brand = 'realtutorialhub' | 'skillup' | 'skip';
type TargetBrand = Exclude<Brand, 'skip'>;
const isDryRun = process.argv.includes('--dry-run');

interface SourceUserRow {
  id: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
  is_blocked: boolean;
  last_active_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface MigrationResult {
  email: string;
  sourceId: string;
  brand: Brand;
  brandUserId?: string;
  shadowUserId?: string;
  brandUserCreated?: boolean;
  shadowUserCreated?: boolean;
  alreadyExisted?: boolean;
  error?: string;
}

function prefix(message: string): string {
  return isDryRun ? `[DRY RUN] ${message}` : message;
}

function log(message: string): void {
  console.log(prefix(message));
}

function logError(message: string): void {
  console.error(prefix(message));
}

const envCandidates = [path.resolve(process.cwd(), '.env.local'), path.resolve(process.cwd(), '.env')];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
}

const BRAND_OVERRIDE_MAP: Record<string, Brand> = {
  'root@system.internal': 'skip',
  'k6-test@loadtest.example.com': 'skip',
  'k6-lockout@loadtest.example.com': 'skip',
  'admin@test.com': 'realtutorialhub',
  'superadmin@test.com': 'realtutorialhub',
  'admin@quizplatform.com': 'realtutorialhub',
  'ajayshah@gmail.com': 'realtutorialhub',
  'suresh.joshi.niit@gmail.com': 'realtutorialhub',
  'google@gmail.com': 'realtutorialhub',
  'faculty@test.com': 'skillup',
};

function determineBrand(email: string): Brand {
  const lowerEmail = email.toLowerCase();
  const override = BRAND_OVERRIDE_MAP[lowerEmail];
  if (override) return override;

  const [localPart = '', domain = ''] = lowerEmail.split('@');
  if (domain === 'skillupitacademy.com') return 'skillup';
  if (domain === 'realtutorialhub.com') return 'realtutorialhub';
  if (localPart.startsWith('skillup')) return 'skillup';
  return 'realtutorialhub';
}

function getPoolForBrand(brand: TargetBrand, rthPool: Pool, skillupPool: Pool): Pool {
  return brand === 'realtutorialhub' ? rthPool : skillupPool;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

async function findBrandUser(
  pool: Pool,
  userId: string,
  email: string,
): Promise<{ id: string; existed: boolean }> {
  const byId = await pool.query('SELECT id FROM users WHERE id = $1 LIMIT 1', [userId]);
  if (byId.rowCount > 0) return { id: byId.rows[0].id as string, existed: true };

  const byEmail = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
  if (byEmail.rowCount > 0) return { id: byEmail.rows[0].id as string, existed: true };

  return { id: userId, existed: false };
}

async function upsertShadowUser(
  peoplePool: Pool,
  sourceUser: SourceUserRow,
  brandUserId: string,
  brand: TargetBrand,
  dryRun: boolean,
): Promise<{ shadowUserId: string; existed: boolean }> {
  const existingByExternal = await peoplePool.query(
    `
      SELECT id
      FROM users
      WHERE external_id = $1
        AND external_brand = $2
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [brandUserId, brand],
  );

  if (existingByExternal.rowCount > 0) {
    const shadowUserId = existingByExternal.rows[0].id as string;
    if (!dryRun) {
      await peoplePool.query(
        `
          UPDATE users
          SET
            email = $2,
            password_hash = $3,
            is_active = $4,
            external_id = $5,
            external_brand = $6,
            platform = $7,
            role = $8,
            updated_at = NOW()
          WHERE id = $1
        `,
        [shadowUserId, sourceUser.email, '', !sourceUser.is_blocked, brandUserId, brand, brand, 'student'],
      );
    }
    return { shadowUserId, existed: true };
  }

  const existingByEmail = await peoplePool.query(
    `
      SELECT id
      FROM users
      WHERE email = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [sourceUser.email],
  );

  if (existingByEmail.rowCount > 0) {
    const shadowUserId = existingByEmail.rows[0].id as string;
    if (!dryRun) {
      await peoplePool.query(
        `
          UPDATE users
          SET
            password_hash = $2,
            is_active = $3,
            external_id = $4,
            external_brand = $5,
            platform = $6,
            role = $7,
            updated_at = NOW()
          WHERE id = $1
        `,
        [shadowUserId, '', !sourceUser.is_blocked, brandUserId, brand, brand, 'student'],
      );
    }
    return { shadowUserId, existed: true };
  }

  if (dryRun) {
    return { shadowUserId: `dry-run-${brandUserId}`, existed: false };
  }

  const inserted = await peoplePool.query(
    `
      INSERT INTO users (
        email,
        password_hash,
        is_active,
        platform,
        external_id,
        external_brand,
        role,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `,
    [
      sourceUser.email,
      '',
      !sourceUser.is_blocked,
      brand,
      brandUserId,
      brand,
      'student',
      sourceUser.created_at,
      sourceUser.updated_at,
    ],
  );

  return { shadowUserId: inserted.rows[0].id as string, existed: false };
}

async function migrate(): Promise<void> {
  const sourcePool = new Pool({ connectionString: requiredEnv('DATABASE_URL') });
  const rthPool = new Pool({ connectionString: requiredEnv('DATABASE_URL_RTH') });
  const skillupPool = new Pool({ connectionString: requiredEnv('DATABASE_URL_SKILLUP') });
  const peoplePool = new Pool({
    connectionString: process.env.DATABASE_URL_PEOPLE ?? process.env.DATABASE_DIRECT_URL_PEOPLE ?? '',
  });

  const results: MigrationResult[] = [];

  try {
    const { rows: sourceUsers } = await sourcePool.query<SourceUserRow>(`
      SELECT
        u.id,
        u.email,
        u.password_hash,
        u.email_verified,
        u.is_blocked,
        u.last_active_at,
        u.deleted_at,
        u.created_at,
        u.updated_at
      FROM users u
      ORDER BY u.created_at ASC
    `);

    log(`Found ${sourceUsers.length} users in quiz_platform_prod`);

    for (const user of sourceUsers) {
      const brand = determineBrand(user.email);
      const result: MigrationResult = {
        email: user.email,
        sourceId: user.id,
        brand,
      };

      if (brand === 'skip') {
        log(`SKIP  ${user.email} (system/test account)`);
        if (isDryRun) {
          log(`[DRY RUN] WOULD SKIP ${user.email}`);
        }
        results.push(result);
        continue;
      }

      const brandPool = getPoolForBrand(brand, rthPool, skillupPool);

      try {
        const brandUser = await findBrandUser(brandPool, user.id, user.email);
        result.brandUserId = brandUser.id;
        result.brandUserCreated = !brandUser.existed;

        if (isDryRun) {
          if (brandUser.existed) {
            log(`[DRY RUN] WOULD UPDATE brand user ${user.email} -> ${brand}`);
          } else {
            log(`[DRY RUN] WOULD MIGRATE ${user.email} -> ${brand}`);
          }
        } else if (brandUser.existed) {
          await brandPool.query(
            `
              UPDATE users
              SET
                email = $2,
                password_hash = $3,
                email_verified = $4,
                is_blocked = $5,
                last_active_at = $6,
                deleted_at = $7,
                updated_at = $8
              WHERE id = $1
            `,
            [
              brandUser.id,
              user.email,
              user.password_hash,
              user.email_verified,
              user.is_blocked,
              user.last_active_at,
              user.deleted_at,
              user.updated_at,
            ],
          );
        } else {
          await brandPool.query(
            `
              INSERT INTO users (
                id,
                email,
                password_hash,
                email_verified,
                is_blocked,
                last_active_at,
                deleted_at,
                created_at,
                updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `,
            [
              user.id,
              user.email,
              user.password_hash,
              user.email_verified,
              user.is_blocked,
              user.last_active_at,
              user.deleted_at,
              user.created_at,
              user.updated_at,
            ],
          );
        }

        const shadow = await upsertShadowUser(peoplePool, user, brandUser.id, brand, isDryRun);
        result.shadowUserId = shadow.shadowUserId;
        result.shadowUserCreated = !shadow.existed;

        if (isDryRun) {
          log(`[DRY RUN] WOULD ${shadow.existed ? 'REUSE' : 'CREATE'} shadow user for ${user.email}`);
          log(`[DRY RUN] WOULD GRANT platform access for ${user.email} -> ${brand}`);
        } else {
          await peoplePool.query(
            `
              INSERT INTO platform_access (user_id, platform)
              VALUES ($1, $2)
              ON CONFLICT (user_id, platform) DO NOTHING
            `,
            [shadow.shadowUserId, brand],
          );
        }

        if (!isDryRun) {
          await brandPool.query(
            'UPDATE users SET shadow_user_id = $1, updated_at = NOW() WHERE id = $2',
            [shadow.shadowUserId, brandUser.id],
          );
        }

        if (isDryRun) {
          log(
            `[DRY RUN] WOULD ${shadow.existed ? 'REUSE' : 'CREATE'} shadow user for ${user.email} (${brand})`,
          );
        } else {
          log(
            `${shadow.existed ? 'EXISTS' : 'MIGRATED'} ${user.email} -> ${brand} (brandId: ${brandUser.id}, shadowId: ${shadow.shadowUserId})`,
          );
        }
      } catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
        logError(`ERROR ${user.email}: ${result.error}`);
      }

      results.push(result);
    }

    const brandResults = results.filter((r) => r.brand !== 'skip' && !r.error);
    const rthCount = brandResults.filter((r) => r.brand === 'realtutorialhub' && r.brandUserCreated).length;
    const skillupCount = brandResults.filter((r) => r.brand === 'skillup' && r.brandUserCreated).length;
    const skipCount = results.filter((r) => r.brand === 'skip').length;
    const shadowCreateCount = brandResults.filter((r) => r.shadowUserCreated).length;
    const shadowReuseCount = brandResults.filter((r) => !r.shadowUserCreated && r.shadowUserId).length;

    const summary = {
      total: results.length,
      migrated: results.filter((r) => r.brand !== 'skip' && !r.error && r.brandUserCreated).length,
      reused: results.filter((r) => r.brand !== 'skip' && !r.error && !r.brandUserCreated).length,
      skipped: results.filter((r) => r.brand === 'skip').length,
      errors: results.filter((r) => r.error).length,
    };

    log('\n===================================');
    log('MIGRATION SUMMARY');
    log('===================================');
    log(`Total:    ${summary.total}`);
    log(`Migrated: ${summary.migrated}`);
    log(`Reused:   ${summary.reused}`);
    log(`Skipped:  ${summary.skipped}`);
    log(`Errors:   ${summary.errors}`);

    if (isDryRun) {
      log('');
      log(`Would migrate ${rthCount} users to rth_prod`);
      log(`Would migrate ${skillupCount} users to skillup_prod`);
      log(`Would skip ${skipCount} users`);
      log(`Would create ${shadowCreateCount} new shadow users`);
      log(`Would reuse ${shadowReuseCount} existing shadow users`);
    }

    if (summary.errors > 0) {
      log('\nErrors:');
      for (const row of results.filter((r) => r.error)) {
        log(`  ${row.email}: ${row.error}`);
      }
    }

    if (!isDryRun) {
      const logPath = path.resolve(process.cwd(), 'scripts/migration-log.json');
      fs.writeFileSync(logPath, JSON.stringify(results, null, 2));
      log(`\nResults written to: ${logPath}`);
    } else {
      log('\nDry run complete. No data was modified.');
    }
  } finally {
    await sourcePool.end();
    await rthPool.end();
    await skillupPool.end();
    await peoplePool.end();
  }
}

migrate().catch((error) => {
  logError(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
