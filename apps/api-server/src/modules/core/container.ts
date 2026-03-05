// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Type<T> = new (...args: any[]) => T;

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
   * Alias for register, clearer in tests when overriding implementations.
   */
  set<T>(token: Type<T> | string, instance: T) {
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
        // Fallback: support factory functions used in tests (non-constructors)
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const produced = (token as any)();
          this.instances.set(token, produced);
          return produced as T;
        } catch (_factoryError) {
          throw new Error(`Failed to instantiate ${token.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // If token is already a mock object (common in vitest), return it directly
    if (typeof token === 'object' && token !== null) {
      return token as T;
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
