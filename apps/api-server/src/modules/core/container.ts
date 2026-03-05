export type Type<T> = new (...args: unknown[]) => T;

/**
 * Lightweight Dependency Injection Container for managing service and repository singletons.
 * Supports class-based registration with lazy instantiation.
 */
class DIContainer {
  private instances = new Map<Type<unknown> | string, unknown>();

  /**
   * Manually register an instance with a token or class.
   */
  register<T>(token: Type<T> | string, instance: T) {
    this.instances.set(token, instance);
  }

  /**
   * Retrieves an instance from the container. 
   * If the token is a class and no instance exists, it will lazily instantiate it.
   */
  get<T>(token: Type<T> | string): T {
    const instance = this.instances.get(token);
    if (instance !== undefined) return instance as T;

    if (typeof token === 'function') {
      try {
        const newInstance = new token();
        this.instances.set(token, newInstance);
        return newInstance;
      } catch (error) {
        throw new Error(`Failed to instantiate ${token.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    throw new Error(`Token ${token} not registered in DI container`);
  }

  /**
   * Clears all instances from the container. Use primarily in test teardown.
   */
  reset() {
    this.instances.clear();
  }
}

export const container = new DIContainer();
