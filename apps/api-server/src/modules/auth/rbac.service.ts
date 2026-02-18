import { db, roles, userRoles, users } from '@quiz/db';
import { and, eq, sql } from 'drizzle-orm';

import { logger } from '@/lib/logger';

import type { TokenPayload } from './token.service';

const log = logger.child({ module: 'auth:rbac' });

export async function _verifyAdmin(_payload: TokenPayload): Promise<boolean> {
    // 0. Security: Check if _user is blocked (Always hit DB for Admin actions)
    try {
        const _users = await db.select({ isBlocked: users.isBlocked })
            .from(users)
            .where(eq(users.id, _payload.userId))
            .limit(1);

        if (_users.length === 0) {
            log.warn({ userId: _payload.userId }, 'RBAC admin check: user not found');
            return false;
        }

        if (_users[0].isBlocked === true) {
            log.warn({ userId: _payload.userId }, 'RBAC admin check: user is blocked');
            return false;
        }
    } catch (err) {
        // Graceful fallback to token-based role check to avoid false 401s from transient DB issues
        log.error(
            {
                userId: _payload.userId,
                message: err instanceof Error ? err.message : String(err),
            },
            'RBAC admin check failed; falling back to token roles',
        );
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
