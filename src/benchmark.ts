import Neocache from './index';
import { performance } from 'perf_hooks';
import NodeCache from 'node-cache';
import { LRUCache } from 'lru-cache';
import QuickLRU from 'quick-lru';

/**
 * Interface for all cache implementations to ensure consistent benchmarking
 */
interface CacheImplementation {
  name: string;
  set(key: string, value: any): void;
  get(key: string): Promise<any> | any;
  dispose?(): void;
}

/**
 * Neocache implementation
 */
class NeocacheImpl implements CacheImplementation {
  name = 'Neocache';
  private cache: Neocache;

  constructor(options?: {
    maxSize?: number;
    defaultExpireTimeMs?: number;
    purgeIntervalMs?: number;
  }) {
    this.cache = new Neocache(options);
  }

  set(key: string, value: any): void {
    this.cache.set(key, value);
  }

  get(key: string): any {
    return this.cache.getOnly(key);
  }

  dispose(): void {
    this.cache.dispose();
  }
}

/**
 * node-cache implementation
 */
class NodeCacheImpl implements CacheImplementation {
  name = 'node-cache';
  private cache: NodeCache;

  constructor(options?: { maxSize?: number; defaultExpireTimeMs?: number }) {
    this.cache = new NodeCache({
      stdTTL: options?.defaultExpireTimeMs
        ? options.defaultExpireTimeMs / 1000
        : 3600,
      maxKeys: -1, // Hardcode to unlimited keys because it does not support LRU
      checkperiod: 0, // disable automatic deletion during benchmarks
    });
  }

  set(key: string, value: any): void {
    this.cache.set(key, value);
  }

  get(key: string): any {
    return this.cache.get(key);
  }

  dispose(): void {
    this.cache.close();
  }
}

/**
 * lru-cache implementation
 */
class LRUCacheImpl implements CacheImplementation {
  name = 'lru-cache';
  private cache: LRUCache<string, any>;

  constructor(options?: { maxSize?: number; defaultExpireTimeMs?: number }) {
    this.cache = new LRUCache({
      max: options?.maxSize,
      ttl: options?.defaultExpireTimeMs,
    });
  }

  set(key: string, value: any): void {
    this.cache.set(key, value);
  }

  get(key: string): any {
    return this.cache.get(key);
  }
}

/**
 * quick-lru implementation
 */
class QuickLRUImpl implements CacheImplementation {
  name = 'quick-lru';
  private cache: QuickLRU<string, any>;

  constructor(options?: { maxSize?: number }) {
    this.cache = new QuickLRU({
      maxSize: options?.maxSize || 1000,
    });
  }

  set(key: string, value: any): void {
    this.cache.set(key, value);
  }

  get(key: string): any {
    return this.cache.get(key);
  }
}

/**
 * Benchmarking class that works with any cache implementation
 */
class CacheBenchmark {
  private cache: CacheImplementation;

  constructor(cacheImpl: CacheImplementation) {
    this.cache = cacheImpl;
  }

  /**
   * Measures the time to set items in the cache
   */
  async benchmarkSet(count: number): Promise<number> {
    const start = performance.now();

    for (let i = 0; i < count; i++) {
      this.cache.set(`key-${i}`, `value-${i}`);
    }

    const end = performance.now();
    return end - start;
  }

  /**
   * Measures the time to get items from the cache
   */
  async benchmarkGet(count: number): Promise<number> {
    const populateCount = Math.min(count, 100000); // Increased from 10000

    // First populate the cache
    try {
      for (let i = 0; i < populateCount; i++) {
        this.cache.set(`key-${i}`, `value-${i}`);
      }
    } catch (error) {
      console.error(`Error populating cache: ${error.message}`);
    }

    // Randomize the access pattern
    const keys = Array.from({ length: count }, (_, i) => i);
    keys.sort(() => Math.random() - 0.5);

    const start = performance.now();

    // Read within the range we populated
    for (const i of keys) {
      const keyIndex = i % populateCount;
      await this.cache.get(`key-${keyIndex}`);
    }

    const end = performance.now();
    return end - start;
  }

  /**
   * Measures the time for LRU eviction with a full cache
   */
  async benchmarkLRUEviction(
    cacheSize: number,
    operationCount: number,
  ): Promise<number> {
    try {
      // Fill the cache to capacity
      for (let i = 0; i < cacheSize; i++) {
        this.cache.set(`key-${i}`, `value-${i}`);
      }

      const start = performance.now();

      // Add more items to trigger LRU eviction
      for (let i = 0; i < operationCount; i++) {
        this.cache.set(`new-key-${i}`, `new-value-${i}`);
      }

      const end = performance.now();

      return end - start;
    } catch (error) {
      console.error(`Error in LRU eviction benchmark: ${error.message}`);
      return 0; // Return 0 if the test failed
    }
  }

  /**
   * Measures the time for mixed operations (get/set) with random access patterns
   */
  async benchmarkMixedOperations(operationCount: number): Promise<number> {
    const keySpace = operationCount;

    try {
      // Prepopulate some keys
      for (let i = 0; i < keySpace; i++) {
        this.cache.set(`key-${i}`, `value-${i}`);
      }

      const start = performance.now();

      for (let i = 0; i < operationCount; i++) {
        const operation = Math.random() > 0.5 ? 'get' : 'set';
        const keyIndex = Math.floor(Math.random() * keySpace);

        if (operation === 'get') {
          await this.cache.get(`key-${keyIndex}`);
        } else {
          this.cache.set(`key-${keyIndex}`, `value-${i}`);
        }
      }

      const end = performance.now();

      return end - start;
    } catch (error) {
      console.error(`Error in mixed operations benchmark: ${error.message}`);
      return 0; // Return 0 if the test failed
    }
  }

  dispose() {
    if (this.cache.dispose) {
      this.cache.dispose();
    }
  }
}

/**
 * Run benchmarks across all cache implementations
 */
async function runComparativeBenchmarks() {
  console.log('Comparative Cache Benchmarks\n');
  console.log('==========================\n');

  const cacheOptions = {
    maxSize: 10000,
    defaultExpireTimeMs: 3600000,
  };

  const cacheImplementations: CacheImplementation[] = [
    // new NodeCacheImpl(cacheOptions),
    new LRUCacheImpl(cacheOptions),
    new QuickLRUImpl({ maxSize: cacheOptions.maxSize }),
    new NeocacheImpl(cacheOptions),
  ];

  // Format utility
  const formatOpsPerSec = (count: number, timeMs: number) => {
    if (timeMs <= 0) return 'N/A';
    const opsPerSec = count / (timeMs / 1000);
    return opsPerSec >= 100000
      ? `${(opsPerSec / 1000000).toFixed(2)}M ops/sec`
      : `${opsPerSec.toFixed(0)} ops/sec`;
  };

  // Table header
  console.log('SET OPERATIONS');
  console.log('─────────────────────────────────────────────────────────');
  console.log(
    'Library      | 100,000 items  | 1,000,000 items | 10,000,000 items ',
  );
  console.log('─────────────────────────────────────────────────────────');

  // Set operation benchmarks
  const setOperations = [100000, 1000000, 10000000];
  for (const impl of cacheImplementations) {
    const results = [];

    for (const count of setOperations) {
      const benchmark = new CacheBenchmark(impl);
      const time = await benchmark.benchmarkSet(count);
      results.push(`${formatOpsPerSec(count, time)}`);
      benchmark.dispose();
    }

    console.log(
      `${impl.name.padEnd(12)} | ${results[0].padEnd(15)} | ${results[1].padEnd(
        15,
      )} | ${results[2]}`,
    );
  }

  console.log('\n');

  // GET OPERATIONS
  console.log('GET OPERATIONS');
  console.log('─────────────────────────────────────────────────────────');
  console.log(
    'Library      | 100,000 items  | 1,000,000 items | 10,000,000 items ',
  );
  console.log('─────────────────────────────────────────────────────────');

  const getOperations = [100000, 1000000, 10000000];
  for (const impl of cacheImplementations) {
    const results = [];

    for (const count of getOperations) {
      const benchmark = new CacheBenchmark(impl);
      const time = await benchmark.benchmarkGet(count);
      results.push(`${formatOpsPerSec(count, time)}`);
      benchmark.dispose();
    }

    console.log(
      `${impl.name.padEnd(12)} | ${results[0].padEnd(15)} | ${results[1].padEnd(
        15,
      )} | ${results[2]}`,
    );
  }

  console.log('\n');

  // MIXED OPERATIONS
  console.log('MIXED OPERATIONS (500,000 random get/set operations)');
  console.log('─────────────────────────────────────────────────────────');
  console.log('Library      | Performance    ');
  console.log('─────────────────────────────');

  for (const impl of cacheImplementations) {
    const benchmark = new CacheBenchmark(impl);
    const time = await benchmark.benchmarkMixedOperations(500000);
    console.log(`${impl.name.padEnd(12)} | ${formatOpsPerSec(500000, time)}`);
    benchmark.dispose();
  }

  console.log('\n');

  // LRU EVICTION
  // Remove node cache from the list because it does not support LRU eviction

  const lruCacheImplementations = cacheImplementations.filter(
    (impl) => impl.name !== 'node-cache',
  );
  console.log('LRU EVICTION (adding 500,000 items to a cache of 10,000 items)');
  console.log('─────────────────────────────────────────────────────────');
  console.log('Library      | Performance    ');
  console.log('─────────────────────────────');

  for (const impl of lruCacheImplementations) {
    const ops = 500000;
    const benchmark = new CacheBenchmark(impl);
    const time = await benchmark.benchmarkLRUEviction(10000, ops);
    console.log(`${impl.name.padEnd(12)} | ${formatOpsPerSec(ops, time)}`);
    benchmark.dispose();
  }

  console.log('\n');

  console.log('Benchmark complete!');
}

/**
 * Run the original Neocache benchmark for backward compatibility
 */
async function runOriginalBenchmarks() {
  console.log('Running Neocache Benchmarks...\n');

  // Basic set operations
  const setOperations = [10000, 1000000, 10000000];
  for (const count of setOperations) {
    const benchmark = new CacheBenchmark(new NeocacheImpl({ maxSize: 10000 }));
    const time = await benchmark.benchmarkSet(count);
    console.log(
      `Setting ${count} items: ${time.toFixed(2)}ms (${(
        count /
        (time / 1000)
      ).toFixed(0)} ops/sec)`,
    );
    benchmark.dispose();
  }

  console.log('');

  // Basic get operations
  const getOperations = [100000, 1000000, 10000000];
  for (const count of getOperations) {
    const benchmark = new CacheBenchmark(new NeocacheImpl());
    const time = await benchmark.benchmarkGet(count);
    console.log(
      `Getting ${count} items: ${time.toFixed(2)}ms (${(
        count /
        (time / 1000)
      ).toFixed(0)} ops/sec)`,
    );
    benchmark.dispose();
  }

  console.log('');

  // LRU eviction benchmark
  const lruBenchmark = new CacheBenchmark(new NeocacheImpl());
  const lruEvictionTime = await lruBenchmark.benchmarkLRUEviction(100000, 500000); // Increased from 10000, 50000
  console.log(
    `LRU eviction with 100000 items cache adding 500000 items: ${lruEvictionTime.toFixed(
      2,
    )}ms (${(500000 / (lruEvictionTime / 1000)).toFixed(0)} ops/sec)`,
  );
  lruBenchmark.dispose();

  console.log('');

  // Mixed operations
  const mixedBenchmark = new CacheBenchmark(
    new NeocacheImpl({ maxSize: 500000 }), // Increased from 50000
  );
  const mixedTime = await mixedBenchmark.benchmarkMixedOperations(500000); // Increased from 50000
  console.log(
    `Mixed 500000 operations (random get/set): ${mixedTime.toFixed(2)}ms (${(
      500000 /
      (mixedTime / 1000)
    ).toFixed(0)} ops/sec)`,
  );
  mixedBenchmark.dispose();
}

// Run the benchmarks when this file is executed directly
if (require.main === module) {
  if (process.argv.includes('--original')) {
    runOriginalBenchmarks().catch(console.error);
  } else {
    runComparativeBenchmarks().catch(console.error);
  }
}

export { CacheBenchmark, NeocacheImpl as Neocache };
