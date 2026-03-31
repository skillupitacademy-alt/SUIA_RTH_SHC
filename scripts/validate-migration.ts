import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

type Brand = 'realtutorialhub' | 'skillup' | 'skip';

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

const envCandidates = [path.resolve(process.cwd(), '.env.local'), path.resolve(process.cwd(), '.env')];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
}

const sourcePool = new Pool({ connectionString: process.env.DATABASE_URL ?? '' });
const rthPool = new Pool({ connectionString: process.env.DATABASE_URL_RTH ?? '' });
const skillupPool = new Pool({ connectionString: process.env.DATABASE_URL_SKILLUP ?? '' });
const peoplePool = new Pool({
  connectionString: process.env.DATABASE_URL_PEOPLE ?? process.env.DATABASE_DIRECT_URL_PEOPLE ?? '',
});

function loadMigrationLog(): MigrationResult[] {
  const logPath = path.resolve(process.cwd(), 'scripts/migration-log.json');
  if (!fs.existsSync(logPath)) {
    throw new Error('migration-log.json not found. Run migrate-existing-users.ts first.');
  }

  return JSON.parse(fs.readFileSync(logPath, 'utf8')) as MigrationResult[];
}

async function validate(): Promise<void> {
  const migrationLog = loadMigrationLog();
  console.log('Running migration validation...\n');

  let passed = 0;
  let failed = 0;

  const check = (label: string, condition: boolean, detail?: string) => {
    if (condition) {
      console.log(`PASS: ${label}`);
      passed++;
    } else {
      console.log(`FAIL: ${label}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  };

  try {
    const migrated = migrationLog.filter((row) => row.brand !== 'skip' && !row.error);
    const migratedEmails = migrated.map((row) => row.email);

    const rthMissing = await rthPool.query(`
      SELECT email
      FROM users
      WHERE deleted_at IS NULL
        AND shadow_user_id IS NULL
    `);
    const skillupMissing = await skillupPool.query(`
      SELECT email
      FROM users
      WHERE deleted_at IS NULL
        AND shadow_user_id IS NULL
    `);
    const brandUserIssues = [
      ...rthMissing.rows.map((row) => ({ ...row, brand: 'realtutorialhub' })),
      ...skillupMissing.rows.map((row) => ({ ...row, brand: 'skillup' })),
    ];

    check(
      'All migrated brand users have shadow_user_id',
      brandUserIssues.length === 0,
      brandUserIssues.length > 0
        ? `Missing: ${brandUserIssues.map((row: any) => `${row.email} (${row.brand})`).join(', ')}`
        : undefined,
    );

    const { rows: duplicateRthEmails } = await rthPool.query(`
      SELECT email, COUNT(*)::int AS count
      FROM users
      WHERE deleted_at IS NULL
      GROUP BY email
      HAVING COUNT(*) > 1
    `);
    check(
      'No duplicate emails in rth_prod',
      duplicateRthEmails.length === 0,
      duplicateRthEmails.length > 0 ? `Duplicates: ${duplicateRthEmails.map((row) => row.email).join(', ')}` : undefined,
    );

    const { rows: duplicateSkillupEmails } = await skillupPool.query(`
      SELECT email, COUNT(*)::int AS count
      FROM users
      WHERE deleted_at IS NULL
      GROUP BY email
      HAVING COUNT(*) > 1
    `);
    check(
      'No duplicate emails in skillup_prod',
      duplicateSkillupEmails.length === 0,
      duplicateSkillupEmails.length > 0 ? `Duplicates: ${duplicateSkillupEmails.map((row) => row.email).join(', ')}` : undefined,
    );

    const { rows: missingShadowMappings } = await peoplePool.query(
      `
        SELECT email
        FROM users
        WHERE deleted_at IS NULL
          AND (external_id IS NULL OR external_brand IS NULL)
          AND email = ANY($1::text[])
      `,
      [migratedEmails],
    );
    check(
      'All migrated people_prod users have external_id/external_brand',
      missingShadowMappings.length === 0,
      missingShadowMappings.length > 0
        ? `Missing mappings: ${missingShadowMappings.map((row) => row.email).join(', ')}`
        : undefined,
    );

    const { rows: noAccess } = await peoplePool.query(
      `
        SELECT u.email
        FROM users u
        JOIN (
          SELECT email
          FROM users
          WHERE external_id IS NOT NULL
            AND external_brand IS NOT NULL
        ) migrated ON migrated.email = u.email
        LEFT JOIN platform_access pa ON pa.user_id = u.id
        WHERE pa.id IS NULL
          AND u.deleted_at IS NULL
      `,
    );
    check(
      'All migrated shadow users have platform_access',
      noAccess.length === 0,
      noAccess.length > 0 ? `Missing access: ${noAccess.map((row) => row.email).join(', ')}` : undefined,
    );

    const { rows: sourceCnt } = await sourcePool.query('SELECT COUNT(*)::int AS count FROM users');
    const { rows: rthCnt } = await rthPool.query('SELECT COUNT(*)::int AS count FROM users');
    const { rows: skillupCnt } = await skillupPool.query('SELECT COUNT(*)::int AS count FROM users');
    const { rows: peopleCnt } = await peoplePool.query(`
      SELECT COUNT(*)::int AS count
      FROM users
      WHERE external_id IS NOT NULL
        AND external_brand IS NOT NULL
    `);

    console.log('\n--- Count Summary ---');
    console.log(`Source (quiz_platform_prod): ${sourceCnt[0].count}`);
    console.log(`RTH (rth_prod):              ${rthCnt[0].count}`);
    console.log(`SkillUp (skillup_prod):      ${skillupCnt[0].count}`);
    console.log(`Shadow (people_prod):        ${peopleCnt[0].count}`);
  } finally {
    await sourcePool.end();
    await rthPool.end();
    await skillupPool.end();
    await peoplePool.end();
  }

  console.log('\n===================================');
  console.log(`VALIDATION: ${passed} passed, ${failed} failed`);
  console.log('===================================');

  if (failed > 0) {
    process.exit(1);
  }
}

validate().catch((error) => {
  console.error('Validation failed:', error);
  process.exit(1);
});
