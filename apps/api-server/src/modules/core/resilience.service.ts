import { logger } from "@/lib/logger";

/**
 * System Features that can be throttled or disabled during high load.
 */
export type SystemFeature = 'analytics' | 'ai_tutor' | 'report_generation' | 'notifications';

/**
 * Service to manage system resilience and automated load-shedding.
 * Helps protect the core 'Exam Taking' mission.
 */
export class ResilienceService {
  private static log = logger.child({ module: 'resilience' });

  /**
   * Check if a specific feature is currently enabled.
   * Logic: 
   * 1. Check for manual override in Environment Variables.
   * 2. (Future) Check Redis for dynamic 'Safe Mode' activation based on system load metrics.
   */
  static async isFeatureEnabled(feature: SystemFeature): Promise<boolean> {
    // 1. Check Global Safe Mode (Kill-switch for all non-critical features)
    const isSafeModeActive = process.env.SAFE_MODE === 'true';
    
    if (isSafeModeActive) {
      this.log.warn({ feature }, "[Resilience] Safe Mode ACTIVE. Throttling non-critical feature.");
      return false;
    }

    // 2. Specific Feature Flags
    // e.g., DISABLE_AI=true
    const featureEnvKey = `DISABLE_${feature.toUpperCase()}`;
    if (process.env[featureEnvKey] === 'true') {
      this.log.info({ feature }, "[Resilience] Feature specifically disabled via environment.");
      return false;
    }

    // 3. (Hook for future dynamic logic)
    // Here we can add Redis checks that trigger automatically if 
    // database latency or CPU usage exceeds thresholds.

    return true;
  }

  /**
   * Helper to return a 'Service Busy' response payload.
   */
  static getBusyPayload(feature: SystemFeature) {
    return {
      success: false,
      status: 'load_optimization_active',
      message: `The ${feature} engine is currently optimized to prioritize active exam-takers. Please try again in 5 minutes.`,
      data: null
    };
  }
}
