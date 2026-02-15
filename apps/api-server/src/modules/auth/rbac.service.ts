import { db, roles, userRoles, users } from '@quiz/db';
import { and, eq, sql } from 'drizzle-orm';

import type { TokenPayload } from './token.service';

export async function _verifyAdmin(_payload: TokenPayload): Promise<boolean> {
    // 0. Security: Check if _user is blocked (Always hit DB for Admin actions)
    const _user = await db.query.users.findFirst({
        where: eq(users.id, _payload.userId),
        columns: { isBlocked: true }
    });

    if (_user?.isBlocked === true) {
        return false;
    }

    // 1. JWT Payload Check (Fast Payout)
    const isAdminInToken = _payload.isAdmin === true || (_payload.roles !== undefined && _payload.roles.some(r => 
        ['admin', 'ADMIN', 'super_admin', 'SUPER_ADMIN'].includes(r)
    ));

    if (isAdminInToken === true) {
        return true;
    }

    // 2. Database Verification (Strict)
    const userRole = await db.select()
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(and(
            eq(userRoles.userId, _payload.userId),
            // Use case-insensitive check for robustness
            sql`lower(${roles.name}) IN ('admin', 'super_admin')`
        ))
        .limit(1);

    const passed = userRole.length > 0;
    return passed;
}
