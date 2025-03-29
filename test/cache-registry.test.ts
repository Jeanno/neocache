import { CacheRegistry } from '../src/cache-registry';
import { Neocache } from '../src/neocache';

describe('CacheRegistry', () => {
  let registry: CacheRegistry;

  beforeEach(() => {
    registry = new CacheRegistry();
  });

  afterEach(() => {
    // Clean up any caches to prevent timer leaks
    registry.getCacheNames().forEach(name => {
      registry.removeCache(name);
    });
  });

  describe('basic cache operations', () => {
    test('should create a new cache', () => {
      const cache = registry.createCache('test-cache');
      expect(cache).toBeInstanceOf(Neocache);
      expect(registry.hasCache('test-cache')).toBe(true);
    });

    test('should throw when creating a cache with existing name', () => {
      registry.createCache('test-cache');
      expect(() => registry.createCache('test-cache')).toThrow();
    });

    test('should get or create a cache', () => {
      const cache1 = registry.getCache('test-cache');
      expect(cache1).toBeInstanceOf(Neocache);

      const cache2 = registry.getCache('test-cache');
      expect(cache2).toBe(cache1); // Should return the same instance
    });

    test('should check if a cache exists', () => {
      expect(registry.hasCache('non-existent')).toBe(false);
      registry.createCache('test-cache');
      expect(registry.hasCache('test-cache')).toBe(true);
    });

    test('should remove a cache', () => {
      registry.createCache('test-cache');
      expect(registry.hasCache('test-cache')).toBe(true);

      const result = registry.removeCache('test-cache');
      expect(result).toBe(true);
      expect(registry.hasCache('test-cache')).toBe(false);
    });

    test('should return false when removing non-existent cache', () => {
      const result = registry.removeCache('non-existent');
      expect(result).toBe(false);
    });

    test('should get all cache names', () => {
      registry.createCache('cache1');
      registry.createCache('cache2');
      registry.createCache('cache3');

      const names = registry.getCacheNames();
      expect(names).toHaveLength(3);
      expect(names).toContain('cache1');
      expect(names).toContain('cache2');
      expect(names).toContain('cache3');
    });

    test('should report correct size', () => {
      expect(registry.size).toBe(0);

      registry.createCache('cache1');
      expect(registry.size).toBe(1);

      registry.createCache('cache2');
      expect(registry.size).toBe(2);

      registry.removeCache('cache1');
      expect(registry.size).toBe(1);
    });
  });

  describe('cache options', () => {
    test('should apply default options to new caches', () => {
      const defaultOptions = {
        defaultExpireTimeMs: 10000,
        purgeIntervalMs: 5000,
        maxSize: 100
      };

      const customRegistry = new CacheRegistry(defaultOptions);
      const cache = customRegistry.createCache('test-cache');

      // Verify options were correctly passed through
      expect(cache.options).toMatchObject(defaultOptions);
    });

    test('should merge custom options with default options', () => {
      const defaultOptions = {
        defaultExpireTimeMs: 10000,
        purgeIntervalMs: 5000
      };

      const customOptions = {
        maxSize: 200
      };

      const expectedOptions = {
        ...defaultOptions,
        ...customOptions
      };

      const customRegistry = new CacheRegistry(defaultOptions);
      const cache = customRegistry.createCache('test-cache', customOptions);

      // Verify options were correctly merged
      expect(cache.options).toMatchObject(expectedOptions);
    });
  });
});
