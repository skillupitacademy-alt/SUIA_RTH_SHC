import { db, userRoles, roles } from '@quiz/db';
import { eq, and, sql } from 'drizzle-orm';
import { TokenPayload } from './token.service';

export async function verifyAdmin(payload: TokenPayload): Promise<boolean> {
    // 1. JWT Payload Check (Fast Payout)
    const isAdminInToken = payload.isAdmin || payload.roles?.some(r => 
        ['admin', 'ADMIN', 'super_admin', 'SUPER_ADMIN'].includes(r)
    );

    if (isAdminInToken) return true;

    // 2. Database Verification (Strict)
    const userRole = await db.select()
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(and(
            eq(userRoles.userId, payload.userId),
            // Use case-insensitive check for robustness
            sql`lower(${roles.name}) IN ('admin', 'super_admin')`
        ))
        .limit(1);

    return userRole.length > 0;
}
