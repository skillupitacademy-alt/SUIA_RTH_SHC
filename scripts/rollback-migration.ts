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

const rthPool = new Pool({ connectionString: process.env.DATABASE_URL_RTH ?? '' });
const skillupPool = new Pool({ connectionString: process.env.DATABASE_URL_SKILLUP ?? '' });
const peoplePool = new Pool({
  connectionString: process.env.DATABASE_URL_PEOPLE ?? process.env.DATABASE_DIRECT_URL_PEOPLE ?? '',
});

function loadMigrationLog(): MigrationResult[] {
  const logPath = path.resolve(process.cwd(), 'scripts/migration-log.json');
  if (!fs.existsSync(logPath)) {
    throw new Error('migration-log.json not found. Rollback cannot continue.');
  }
  return JSON.parse(fs.readFileSync(logPath, 'utf8')) as MigrationResult[];
}

async function rollback(): Promise<void> {
  const confirmed = process.argv.includes('--confirm');
  if (!confirmed) {
    console.error('ERROR: Rollback requires --confirm flag');
    console.error('Usage: tsx scripts/rollback-migration.ts --confirm');
    process.exit(1);
  }

  const migrationLog = loadMigrationLog();
  const migrated = migrationLog.filter((row) => row.brand !== 'skip' && !row.error);
  const createdBrandUsers = migrated.filter((row) => row.brandUserCreated && row.brandUserId).map((row) => row.brandUserId as string);
  const createdShadowUsers = migrated.filter((row) => row.shadowUserCreated && row.shadowUserId).map((row) => row.shadowUserId as string);

  console.log('Starting rollback...\n');
  console.log(`Brand users to remove:  ${createdBrandUsers.length}`);
  console.log(`Shadow users to remove: ${createdShadowUsers.length}`);

  try {
    if (createdShadowUsers.length > 0) {
      await peoplePool.query(
        `
          DELETE FROM platform_access
          WHERE user_id = ANY($1::uuid[])
        `,
        [createdShadowUsers],
      );

      await peoplePool.query(
        `
          DELETE FROM users
          WHERE id = ANY($1::uuid[])
        `,
        [createdShadowUsers],
      );

      console.log(`OK Removed ${createdShadowUsers.length} shadow users from people_prod`);
    }

    const rthBrandUsers = migrated
      .filter((row) => row.brand === 'realtutorialhub' && row.brandUserCreated && row.brandUserId)
      .map((row) => row.brandUserId as string);
    const skillupBrandUsers = migrated
      .filter((row) => row.brand === 'skillup' && row.brandUserCreated && row.brandUserId)
      .map((row) => row.brandUserId as string);

    if (rthBrandUsers.length > 0) {
      await rthPool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [rthBrandUsers]);
      console.log(`OK Removed ${rthBrandUsers.length} users from rth_prod`);
    }

    if (skillupBrandUsers.length > 0) {
      await skillupPool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [skillupBrandUsers]);
      console.log(`OK Removed ${skillupBrandUsers.length} users from skillup_prod`);
    }

    console.log('\nRollback complete.');
    console.log('quiz_platform_prod is untouched.');
  } finally {
    await rthPool.end();
    await skillupPool.end();
    await peoplePool.end();
  }
}

rollback().catch((error) => {
  console.error('Rollback failed:', error);
  process.exit(1);
});
