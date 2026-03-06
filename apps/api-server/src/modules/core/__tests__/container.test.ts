import { describe, expect, it, beforeEach } from 'vitest';
import { container } from '../container';

class MockService {
  public id = Math.random();
}

class DependencyService {
  constructor(public service = container.get(MockService)) {}
}

class ThrowingCtor {
  constructor() {
    throw new Error('ctor-fail');
  }
}

class ThrowingCtorAndFactory {
  constructor() {
    throw new Error('ctor-fail-2');
  }
}

describe('DIContainer', () => {
  beforeEach(() => {
    container.reset();
  });

  it('lazily instantiates a class', () => {
    const instance = container.get(MockService);
    expect(instance).toBeInstanceOf(MockService);
  });

  it('returns the same instance (singleton)', () => {
    const first = container.get(MockService);
    const second = container.get(MockService);
    expect(first).toBe(second);
    expect(first.id).toBe(second.id);
  });

  it('supports explicit registration', () => {
    const manualInstance = new MockService();
    container.register(MockService, manualInstance);
    
    const instance = container.get(MockService);
    expect(instance).toBe(manualInstance);
  });

  it('supports string tokens', () => {
    const value = { api: 'v1' };
    container.register('API_CONFIG', value);
    
    expect(container.get('API_CONFIG')).toBe(value);
  });

  it('throws on unregistered string tokens', () => {
    expect(() => container.get('UNKNOWN')).toThrow('not registered');
  });

  it('handles dependency resolution via container.get in constructor', () => {
    const depService = container.get(DependencyService);
    const mockService = container.get(MockService);
    
    expect(depService.service).toBe(mockService);
  });

  it('resets instances', () => {
    const first = container.get(MockService);
    container.reset();
    const second = container.get(MockService);
    
    expect(first).not.toBe(second);
  });

  it('supports factory-function fallback when constructor throws', () => {
    const token = (() => ({ ok: true })) as unknown as typeof ThrowingCtor;
    const value = container.get(token as any);
    expect(value).toEqual({ ok: true });
  });

  it('returns object token directly', () => {
    const token = { literal: true };
    expect(container.get(token as any)).toBe(token);
  });

  it('throws descriptive error when constructor and factory fallback both fail', () => {
    const badToken = (() => {
      throw new Error('factory-fail');
    }) as unknown as typeof ThrowingCtorAndFactory;

    expect(() => container.get(badToken as any)).toThrow('Failed to instantiate');
  });

  it('uses unknown-error text when constructor throws non-Error', () => {
    function badToken() {
      throw 'factory-fail-string';
    }

    expect(() => container.get(badToken as any)).toThrow('Unknown error');
  });
});
