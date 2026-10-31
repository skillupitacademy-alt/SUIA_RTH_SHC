import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { type NextRequest } from 'next/server';
import path from 'path';

export const dynamic = 'force-dynamic';

import { unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";

/**
 * POST /api/migrate
 * 
 * 🔐 SECURITY FIX (MIGRATE-01):
 * - Changed from GET to POST (migrations are not idempotent reads)
 * - Removed fail-open _verifyAdmin fallback
 * - Requires MIGRATION_SECRET — no admin token fallback
 */
async function postHandler(_request: NextRequest) {
  const start = Date.now();
  try {
    // Require migration secret — no fallback to admin token
    const MIGRATION_SECRET = process.env.MIGRATION_SECRET;
    const clientSecret = _request.headers.get('x-migration-secret');

    if (
      !MIGRATION_SECRET ||
      MIGRATION_SECRET === '' ||
      clientSecret !== MIGRATION_SECRET
    ) {
      throw unauthorized("Unauthorized: Valid migration secret required");
    }

    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (DATABASE_URL === undefined || DATABASE_URL === null || DATABASE_URL === '') {
      return ApiResponse.error(new Error("DATABASE_URL not configured"), 500);
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    const db = drizzle(pool);

    // Robust package-based resolution (Avoiding fragile ../../ paths)
    const dbPackagePath = path.dirname(require.resolve('@quiz/db/package.json'));
    const migrationsFolder = path.join(dbPackagePath, 'migrations');
    
    await migrate(db, { migrationsFolder });

    recordCounter('system.api.migrate.success', 1);
    const durationMs = Date.now() - start;
    recordTimer('system.api.migrate.duration', durationMs, { outcome: 'success' });
    return ApiResponse.success({ 
      success: true, 
      message: 'Migrations completed successfully!' 
    }, 200, {
      'X-Duration-Ms': durationMs.toString()
    });
  } catch (error: unknown) {
    recordCounter('system.api.migrate.failure', 1, { reason: 'internal_error' });
    return ApiResponse.error(error);
  }
}

export const POST = withLogging(postHandler, { component: 'system', operation: 'database_migration' });

/**
 * GET /api/migrate — Deprecated, returns 405
 * Migrations must use POST with x-migration-secret header.
 */
export function GET() {
  return ApiResponse.error(
    new Error('Method Not Allowed: Use POST with x-migration-secret header'),
    405
  );
}
