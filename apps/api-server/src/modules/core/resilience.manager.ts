import { logger } from '@/lib/logger';

export class ResilienceManager {
  private static instance: ResilienceManager;
  private highLoadMode: boolean = false;

  private constructor() {
    this.highLoadMode = process.env.HIGH_LOAD_MODE === 'true';
  }

  public static getInstance(): ResilienceManager {
    if (ResilienceManager.instance === undefined) {
      ResilienceManager.instance = new ResilienceManager();
    }
    return ResilienceManager.instance;
  }

  /**
   * Returns true if the system is currently under high load.
   */
  public isHighLoad(): boolean {
    return this.highLoadMode;
  }

  /**
   * Toggles high load mode manually (useful for emergency interventions).
   */
  public setHighLoad(enabled: boolean) {
    this.highLoadMode = enabled;
    logger.warn({ enabled }, '[Resilience] High load mode toggled');
  }

  /**
   * Helper to execute a "heavy" task only if system is not under high load.
   */
  public async runHeavyTask<T>(taskName: string, task: () => Promise<T>): Promise<T | null> {
    if (this.isHighLoad()) {
      logger.info({ taskName }, '[Resilience] Skipping heavy task due to high load');
      return null;
    }
    return await task();
  }
}

export const resilienceManager = ResilienceManager.getInstance();
