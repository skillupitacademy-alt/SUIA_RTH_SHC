import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL not configured' },
        { status: 500 }
      );
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    const db = drizzle(pool);

    // Path to migrations folder relative to the api-server root
    const migrationsFolder = path.join(process.cwd(), '../../packages/db/migrations');
    
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
