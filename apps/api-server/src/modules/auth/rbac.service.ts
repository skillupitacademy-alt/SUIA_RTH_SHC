import { db, userRoles, roles, users } from '@quiz/db';
import { eq, and, sql } from 'drizzle-orm';
import { TokenPayload } from './token.service';

export async function verifyAdmin(payload: TokenPayload): Promise<boolean> {
    // 0. Security: Check if user is blocked (Always hit DB for Admin actions)
    const user = await db.query.users.findFirst({
        where: eq(users.id, payload.userId),
        columns: { isBlocked: true }
    });

    if (user?.isBlocked) {
        return false;
    }

    // 1. JWT Payload Check (Fast Payout)
    const isAdminInToken = payload.isAdmin || payload.roles?.some(r => 
        ['admin', 'ADMIN', 'super_admin', 'SUPER_ADMIN'].includes(r)
    );

    if (isAdminInToken) {
        return true;
    }

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

    const passed = userRole.length > 0;
    return passed;
}
