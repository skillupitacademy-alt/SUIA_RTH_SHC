import pino from 'pino';

import { logger as baseLogger } from '@/lib/logger';

/**
 * Service wrapper for Pino logger (Task 70).
 * Decouples domain logic from the underlying logging library,
 * standardizes error serialization, and allows for clean dependency injection.
 */
export class LoggerService {
  private pinoInstance: pino.Logger;

  constructor(instance?: pino.Logger) {
    this.pinoInstance = instance ?? baseLogger;
  }

  /**
   * Spawns a dedicated child logger with preset context bindings.
   */
  child(bindings: Record<string, unknown>): LoggerService {
    return new LoggerService(this.pinoInstance.child(bindings));
  }

  /**
   * Logs informational messages.
   */
  info(obj: unknown, msg?: string, ...args: unknown[]) {
    this.pinoInstance.info(obj, msg, ...args);
  }

  /**
   * Logs warnings.
   */
  warn(obj: unknown, msg?: string, ...args: unknown[]) {
    this.pinoInstance.warn(obj, msg, ...args);
  }

  /**
   * Logs diagnostic debug messages.
   */
  debug(obj: unknown, msg?: string, ...args: unknown[]) {
    this.pinoInstance.debug(obj, msg, ...args);
  }

  /**
   * Emits trace-level debugging.
   */
  trace(obj: unknown, msg?: string, ...args: unknown[]) {
    this.pinoInstance.trace(obj, msg, ...args);
  }

  /**
   * Logs fatal crashes.
   */
  fatal(obj: unknown, msg?: string, ...args: unknown[]) {
    this.pinoInstance.fatal(obj, msg, ...args);
  }

  /**
   * Enhanced error logger.
   * If the `obj` passed is natively an instance of `Error`, it is automatically
   * wrapped to `{ err: obj }` so that Pino's stdSerializers can correctly
   * extract the stack trace.
   */
  error(obj: unknown, msg?: string, ...args: unknown[]) {
    if (obj instanceof Error) {
      if (msg === undefined) {
         this.pinoInstance.error({ err: obj }, obj.message);
      } else {
         this.pinoInstance.error({ err: obj }, msg, ...args);
      }
    } else {
      this.pinoInstance.error(obj, msg, ...args);
    }
  }
}
