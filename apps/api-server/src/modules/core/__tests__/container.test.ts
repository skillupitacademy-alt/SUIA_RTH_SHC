import { describe, expect, it, beforeEach } from 'vitest';
import { container } from '../container';

class MockService {
  public id = Math.random();
}

class DependencyService {
  constructor(public service = container.get(MockService)) {}
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
});
