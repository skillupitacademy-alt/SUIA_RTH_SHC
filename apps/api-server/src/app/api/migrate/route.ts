import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { type NextRequest, NextResponse } from 'next/server';
import path from 'path';

import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { _verifyAdmin } from '@/modules/auth/rbac.service';
import { TokenService } from '@/modules/auth/token.service';

async function handler(_request: NextRequest) {
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
      const _token = TokenService.getAccessToken(_request, { scope: 'admin' });
      if (_token !== undefined && _token !== null && _token !== '') {
        try {
          const _payload = await TokenService.verifyAccessToken(_token, true);
          isAuthorized = await _verifyAdmin(_payload);
        } catch {
          // Ignore _token errors, authorization remains false
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { _error: 'Unauthorized: Valid migration secret or admin _token required' },
        { status: 401 }
      );
    }

    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (DATABASE_URL === undefined || DATABASE_URL === null || DATABASE_URL === '') {
      return NextResponse.json(
        { _error: 'DATABASE_URL not configured' },
        { status: 500 }
      );
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    const db = drizzle(pool);

    // Robust package-based resolution (Avoiding fragile ../../ paths)
    const dbPackagePath = path.dirname(require.resolve('@quiz/db/package.json'));
    const migrationsFolder = path.join(dbPackagePath, 'migrations');
    
    await migrate(db, { migrationsFolder });

    recordCounter('system.api.migrate.success', 1);
    recordTimer('system.api.migrate.duration', Date.now() - start, { outcome: 'success' });
    return NextResponse.json({ 
      success: true, 
      message: 'Migrations completed successfully!' 
    });
  } catch (_error: unknown) {
    const errorMessage = _error instanceof Error ? _error.message : 'Failed to perform migration';
    recordCounter('system.api.migrate.failure', 1, { reason: 'internal_error' });
    return NextResponse.json({ _error: errorMessage }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: 'system', operation: 'database_migration' });
