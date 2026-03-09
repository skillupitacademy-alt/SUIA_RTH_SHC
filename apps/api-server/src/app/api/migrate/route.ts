import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { type NextRequest } from 'next/server';
import path from 'path';

import { unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { _verifyAdmin } from '@/modules/auth/rbac.service';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

async function getHandler(_request: NextRequest) {
  const start = Date.now();
  try {
    // 1. Check for Internal Migration Secret (P0-SEC-001)
    const MIGRATION_SECRET = process.env.MIGRATION_SECRET;
    const clientSecret = _request.headers.get('x-migration-secret');

    let isAuthorized = false;

    if ((MIGRATION_SECRET !== undefined && MIGRATION_SECRET !== null && MIGRATION_SECRET !== '') && clientSecret === MIGRATION_SECRET) {
      isAuthorized = true;
    } else {
      // 2. Fallback to Admin Authentication (Supports Cookie and Header)
      const _token = container.get(TokenService).getAccessToken(_request, { scope: 'admin' });
      if (_token !== undefined && _token !== null && _token !== '') {
        try {
          const _payload = await container.get(TokenService).verifyAdminAccessToken(_token);
          isAuthorized = await _verifyAdmin(_payload);
        } catch {
          // Ignore _token errors, authorization remains false
        }
      }
    }

    if (!isAuthorized) {
      throw unauthorized("Unauthorized: Valid migration secret or admin token required");
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

export const GET = withLogging(getHandler, { component: 'system', operation: 'database_migration' });
