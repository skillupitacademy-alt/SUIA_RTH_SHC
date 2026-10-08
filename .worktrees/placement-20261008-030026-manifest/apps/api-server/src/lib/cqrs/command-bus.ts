import { logger } from '@/lib/logger';

export interface Command {
  type: string;
}

export interface CommandHandler<T extends Command = Command, R = unknown> {
  handle(command: T): Promise<R>;
}

/**
 * Command Bus for handling write operations (C in CQRS).
 * Uses the primary database (db).
 */
export class CommandBus {
  private handlers = new Map<string, CommandHandler<Command, unknown>>();
  private static instance: CommandBus | undefined;

  private constructor() {}

  public static getInstance(): CommandBus {
    if (CommandBus.instance === undefined) {
      CommandBus.instance = new CommandBus();
    }
    return CommandBus.instance;
  }

  register(type: string, handler: CommandHandler) {
    this.handlers.set(type, handler);
  }

  async dispatch<T extends Command, R = unknown>(command: T): Promise<R> {
    const handler = this.handlers.get(command.type) as CommandHandler<T, R> | undefined;
    if (!handler) {
      throw new Error(`No handler registered for command: ${command.type}`);
    }

    logger.debug({ type: command.type }, '[CommandBus] Dispatching command');
    try {
      return await handler.handle(command);
    } catch (error) {
      logger.error({ error, type: command.type }, '[CommandBus] Command failed');
      throw error;
    }
  }
}

export const commandBus = CommandBus.getInstance();
