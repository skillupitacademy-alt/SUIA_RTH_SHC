/**
 * 🔔 ALERT SYSTEM
 * 
 * Sends alerts for critical system events:
 * - Data integrity violations
 * - Session anomalies
 * - Authentication failures
 * - System errors
 */

export type AlertLevel = 'info' | 'warning' | 'critical';

export interface Alert {
  level: AlertLevel;
  type: string;
  message: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  traceId?: string;
}

/**
 * Send alert to configured webhook (Slack, Discord, etc.)
 */
export async function sendAlert(alert: Alert): Promise<void> {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('⚠️ ALERT_WEBHOOK_URL not configured, alert not sent:', alert);
    return;
  }

  try {
    const emoji = alert.level === 'critical' ? '🚨' : alert.level === 'warning' ? '⚠️' : 'ℹ️';
    
    const payload = {
      text: `${emoji} **${alert.type}**`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} ${alert.type}`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Level:*\n${alert.level.toUpperCase()}`,
            },
            {
              type: 'mrkdwn',
              text: `*Time:*\n${alert.timestamp}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Message:*\n${alert.message}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Details:*\n\`\`\`${JSON.stringify(alert.metadata, null, 2)}\`\`\``,
          },
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('❌ Failed to send alert:', response.status, await response.text());
    } else {
      console.log('✅ Alert sent successfully:', alert.type);
    }
  } catch (error) {
    console.error('❌ Error sending alert:', error);
  }
}

/**
 * Alert for data integrity violation
 */
export async function alertDataIntegrityViolation(data: {
  userId: string;
  email: string;
  traceId?: string;
}): Promise<void> {
  await sendAlert({
    level: 'critical',
    type: 'DATA_INTEGRITY_VIOLATION',
    message: 'User marked as onboarded but profile does not exist',
    metadata: {
      userId: data.userId,
      email: data.email,
      invariant: 'isOnboarded = true → profile MUST exist',
    },
    timestamp: new Date().toISOString(),
    traceId: data.traceId,
  });
}

/**
 * Alert for session anomaly
 */
export async function alertSessionAnomaly(data: {
  userId: string;
  issues: string[];
  traceId?: string;
}): Promise<void> {
  await sendAlert({
    level: 'warning',
    type: 'SESSION_ANOMALY',
    message: `Suspicious session activity detected: ${data.issues.join(', ')}`,
    metadata: {
      userId: data.userId,
      issues: data.issues,
    },
    timestamp: new Date().toISOString(),
    traceId: data.traceId,
  });
}

/**
 * Alert for authentication failure spike
 */
export async function alertAuthFailureSpike(data: {
  count: number;
  timeWindow: string;
  traceId?: string;
}): Promise<void> {
  await sendAlert({
    level: 'warning',
    type: 'AUTH_FAILURE_SPIKE',
    message: `${data.count} authentication failures in ${data.timeWindow}`,
    metadata: {
      count: data.count,
      timeWindow: data.timeWindow,
    },
    timestamp: new Date().toISOString(),
    traceId: data.traceId,
  });
}

/**
 * Alert for system error
 */
export async function alertSystemError(data: {
  error: string;
  component: string;
  traceId?: string;
}): Promise<void> {
  await sendAlert({
    level: 'critical',
    type: 'SYSTEM_ERROR',
    message: `System error in ${data.component}: ${data.error}`,
    metadata: {
      component: data.component,
      error: data.error,
    },
    timestamp: new Date().toISOString(),
    traceId: data.traceId,
  });
}
