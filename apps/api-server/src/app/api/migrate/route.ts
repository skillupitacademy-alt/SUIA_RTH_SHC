import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import path from 'path';
import { TokenService } from '@/modules/auth/token.service';
import { verifyAdmin } from '@/modules/auth/rbac.service';

export async function GET(request: NextRequest) {
  try {
    // 1. Check for Internal Migration Secret (P0-SEC-001)
    const MIGRATION_SECRET = process.env.MIGRATION_SECRET;
    const clientSecret = request.headers.get('x-migration-secret');

    let isAuthorized = false;

    if (MIGRATION_SECRET && clientSecret === MIGRATION_SECRET) {
      isAuthorized = true;
    } else {
      // 2. Fallback to Admin Authentication (Supports Cookie and Header)
      const token = TokenService.getAccessToken(request, { scope: 'admin' });
      if (token) {
        try {
          const payload = await TokenService.verifyAccessToken(token, true);
          isAuthorized = await verifyAdmin(payload);
        } catch {
          // Ignore token errors, authorization remains false
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid migration secret or admin token required' },
        { status: 401 }
      );
    }

    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL not configured' },
        { status: 500 }
      );
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    const db = drizzle(pool);

    // Robust package-based resolution (Avoiding fragile ../../ paths)
    const dbPackagePath = path.dirname(require.resolve('@quiz/db/package.json'));
    const migrationsFolder = path.join(dbPackagePath, 'migrations');
    
    await migrate(db, { migrationsFolder });

    return NextResponse.json({ 
      success: true, 
      message: 'Migrations completed successfully!' 
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
