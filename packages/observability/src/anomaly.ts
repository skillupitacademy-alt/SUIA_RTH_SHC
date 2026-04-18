/**
 * 🧠 ANOMALY DETECTION SYSTEM
 * 
 * Detects suspicious patterns in:
 * - Session behavior (IP changes, device changes)
 * - Authentication attempts (brute force, token misuse)
 * - Data access patterns (unusual queries)
 */

export interface SessionContext {
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  deviceName?: string;
}

export type AnomalyType =
  | 'IP_CHANGED'
  | 'DEVICE_CHANGED'
  | 'USER_AGENT_CHANGED'
  | 'RAPID_REFRESH'
  | 'MULTIPLE_DEVICES'
  | 'SUSPICIOUS_LOCATION';

export interface Anomaly {
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high';
  description: string;
  oldValue?: string;
  newValue?: string;
}

/**
 * Detect session anomalies
 */
export function detectSessionAnomalies(
  oldSession: SessionContext,
  newSession: SessionContext
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // Check IP address change
  if (oldSession.ipAddress && newSession.ipAddress && oldSession.ipAddress !== newSession.ipAddress) {
    anomalies.push({
      type: 'IP_CHANGED',
      severity: 'medium',
      description: 'IP address changed during session',
      oldValue: oldSession.ipAddress,
      newValue: newSession.ipAddress,
    });
  }

  // Check user agent change
  if (oldSession.userAgent && newSession.userAgent && oldSession.userAgent !== newSession.userAgent) {
    anomalies.push({
      type: 'USER_AGENT_CHANGED',
      severity: 'high',
      description: 'User agent changed during session (possible session hijacking)',
      oldValue: oldSession.userAgent?.slice(0, 50),
      newValue: newSession.userAgent?.slice(0, 50),
    });
  }

  // Check device change
  if (oldSession.deviceId && newSession.deviceId && oldSession.deviceId !== newSession.deviceId) {
    anomalies.push({
      type: 'DEVICE_CHANGED',
      severity: 'high',
      description: 'Device ID changed during session',
      oldValue: oldSession.deviceId,
      newValue: newSession.deviceId,
    });
  }

  return anomalies;
}

/**
 * Detect rapid token refresh (possible attack)
 */
export function detectRapidRefresh(
  userId: string,
  refreshAttempts: number,
  timeWindowMs: number
): Anomaly | null {
  const threshold = 10; // Max 10 refreshes per time window
  const timeWindowMinutes = Math.floor(timeWindowMs / 60000);

  if (refreshAttempts > threshold) {
    return {
      type: 'RAPID_REFRESH',
      severity: 'high',
      description: `${refreshAttempts} token refresh attempts in ${timeWindowMinutes} minutes (threshold: ${threshold})`,
      newValue: String(refreshAttempts),
    };
  }

  return null;
}

/**
 * Anomaly detection mode
 */
export type AnomalyMode = 'log' | 'alert' | 'block';

/**
 * Handle detected anomaly based on mode
 */
export function handleAnomaly(
  anomaly: Anomaly,
  mode: AnomalyMode,
  context: {
    userId: string;
    traceId?: string;
  }
): { shouldBlock: boolean; message: string } {
  const logMessage = `⚠️ [ANOMALY] ${anomaly.type}: ${anomaly.description}`;

  switch (mode) {
    case 'log':
      console.warn(logMessage, {
        userId: context.userId,
        traceId: context.traceId,
        severity: anomaly.severity,
      });
      return { shouldBlock: false, message: 'Anomaly logged' };

    case 'alert':
      console.warn(logMessage, {
        userId: context.userId,
        traceId: context.traceId,
        severity: anomaly.severity,
      });
      // Alert will be sent by caller
      return { shouldBlock: false, message: 'Anomaly logged and alert sent' };

    case 'block':
      if (anomaly.severity === 'high') {
        console.error(`🚨 [ANOMALY BLOCKED] ${anomaly.type}`, {
          userId: context.userId,
          traceId: context.traceId,
        });
        return { shouldBlock: true, message: 'Session blocked due to high-severity anomaly' };
      }
      console.warn(logMessage, {
        userId: context.userId,
        traceId: context.traceId,
        severity: anomaly.severity,
      });
      return { shouldBlock: false, message: 'Anomaly logged (not blocked - severity too low)' };

    default:
      return { shouldBlock: false, message: 'Unknown mode' };
  }
}

/**
 * Get anomaly detection configuration
 */
export function getAnomalyConfig(): {
  mode: AnomalyMode;
  enabled: boolean;
} {
  const mode = (process.env.ANOMALY_DETECTION_MODE as AnomalyMode) || 'log';
  const enabled = process.env.ANOMALY_DETECTION_ENABLED !== 'false';

  return { mode, enabled };
}
