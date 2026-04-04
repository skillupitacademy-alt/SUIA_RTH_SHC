import { and, eq, sql } from 'drizzle-orm';

import { logger } from '@/lib/logger';
import { type RequestBrand } from '@/lib/request-brand';
import { getAuthBrandContext, shouldUseBrandBinding } from '@/modules/auth/brand-db';

import type { TokenPayload } from './token.service';

const log = logger.child({ module: 'auth:rbac' });

export async function _verifyAdmin(_payload: TokenPayload): Promise<boolean> {
    const tokenRoles = _payload.roles !== undefined && _payload.roles.some(r =>
        ['admin', 'super_admin', 'infrastructure'].includes(r.toLowerCase())
    );
    const isAdminInToken = _payload.isAdmin === true || tokenRoles;
    const brand = _payload.brand === 'skillup' ? 'skillup' : 'realtutorialhub';
    const authContext = shouldUseBrandBinding()
        ? getAuthBrandContext(brand as RequestBrand)
        : getAuthBrandContext('realtutorialhub');

    // 0. Security: Check if _user is blocked (Always hit DB for Admin actions)
    try {
        const _users = await authContext.db.select({ isBlocked: authContext.tables.users.isBlocked })
            .from(authContext.tables.users)
            .where(eq(authContext.tables.users.id, _payload.userId))
            .limit(1);

        if (_users.length === 0) {
            log.warn({ userId: _payload.userId, brand }, 'RBAC admin check: user not found in brand auth DB; falling back to token claims');
            return isAdminInToken;
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
    if (isAdminInToken === true) {
        return true;
    }

    // 2. Database Verification (Strict)
    const userRole = await authContext.db.select()
        .from(authContext.tables.userRoles)
        .innerJoin(authContext.tables.roles, eq(authContext.tables.userRoles.roleId, authContext.tables.roles.id))
        .where(and(
            eq(authContext.tables.userRoles.userId, _payload.userId),
            // Use case-insensitive check for robustness
            sql`lower(${authContext.tables.roles.name}) IN ('admin', 'super_admin', 'infrastructure')`
        ))
        .limit(1);

    const passed = userRole.length > 0;
    return passed;
}
