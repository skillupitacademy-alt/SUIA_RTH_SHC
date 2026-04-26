/**
 * 🔐 RBAC AUDIT LOGGING
 * 
 * Logs all RBAC decisions for security monitoring and forensics
 */

export interface RBACDecision {
  requestId?: string; // 🔥 For request correlation
  userId: string;
  permission: string;
  result: 'GRANTED' | 'DENIED';
  reason?: string;
  resource?: string;
  brand?: string;
}

/**
 * 🔥 Log RBAC decision for audit trail
 * 
 * This creates a forensic trail for:
 * - Security incidents
 * - Compliance audits (SOC 2, GDPR)
 * - Permission debugging
 */
export function logRBACDecision(decision: RBACDecision): void {
  const logEntry = {
    tag: 'RBAC_AUDIT',
    timestamp: new Date().toISOString(),
    requestId: decision.requestId, // 🔥 Request correlation
    userId: decision.userId.slice(0, 8), // Truncate for privacy
    permission: decision.permission,
    result: decision.result,
    reason: decision.reason,
    resource: decision.resource,
    brand: decision.brand,
  };
  
  if (decision.result === 'DENIED') {
    console.warn('[RBAC_AUDIT]', JSON.stringify(logEntry));
  } else {
    console.log('[RBAC_AUDIT]', JSON.stringify(logEntry));
  }
}

/**
 * 🔥 Log ownership check for audit trail
 */
export function logOwnershipCheck(params: {
  requestingUserId: string;
  resourceOwnerId: string;
  permission: string;
  result: 'GRANTED' | 'DENIED';
  reason: string;
}): void {
  console.log('[OWNERSHIP_AUDIT]', JSON.stringify({
    tag: 'OWNERSHIP_AUDIT',
    timestamp: new Date().toISOString(),
    requestingUserId: params.requestingUserId.slice(0, 8),
    resourceOwnerId: params.resourceOwnerId.slice(0, 8),
    permission: params.permission,
    result: params.result,
    reason: params.reason,
    isOwner: params.requestingUserId === params.resourceOwnerId,
  }));
}
