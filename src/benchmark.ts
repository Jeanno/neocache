import Neocache from './neocache';
import { performance } from 'perf_hooks';
import NodeCache from 'node-cache';
import { LRUCache } from 'lru-cache';
import QuickLRU from 'quick-lru';
import memoryCache from 'memory-cache';
import * as tinyLru from 'tiny-lru';

/**
 * Interface for all cache implementations to ensure consistent benchmarking
 */
interface CacheImplementation {
  name: string;
  set(key: string, value: any): void;
  get(key: string): any;
  dispose?(): void;
  reset(): void;
}

/**
 * Neocache implementation
 */
class NeocacheImpl implements CacheImplementation {
  name = 'Neocache';
  private cache: Neocache;
  private options?: {
    maxSize?: number;
    defaultExpireTimeMs?: number;
    purgeIntervalMs?: number;
  };

  constructor(options?: {
    maxSize?: number;
    defaultExpireTimeMs?: number;
    purgeIntervalMs?: number;
  }) {
    this.options = options;
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

  reset(): void {
    this.dispose();
    this.cache = new Neocache(this.options);
  }
}

/**
 * node-cache implementation
 */
class NodeCacheImpl implements CacheImplementation {
  name = 'node-cache';
  private cache: NodeCache;
  private options?: { maxSize?: number; defaultExpireTimeMs?: number };

  constructor(options?: { maxSize?: number; defaultExpireTimeMs?: number }) {
    this.options = options;
    this.cache = new NodeCache({
      stdTTL: options?.defaultExpireTimeMs
        ? options.defaultExpireTimeMs / 1000
        : 3600,
      maxKeys: options?.maxSize || 1000,
      checkperiod: null, // disable automatic deletion during benchmarks
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

  reset(): void {
    this.cache = new NodeCache({
      stdTTL: this.options?.defaultExpireTimeMs
        ? this.options.defaultExpireTimeMs / 1000
        : 3600,
      maxKeys: this.options?.maxSize || 1000,
      checkperiod: null, // disable automatic deletion during benchmarks
    });
  }
}

/**
 * lru-cache implementation
 */
class LRUCacheImpl implements CacheImplementation {
  name = 'lru-cache';
  private cache: LRUCache<string, any>;
  private options?: { maxSize?: number; defaultExpireTimeMs?: number };

  constructor(options?: { maxSize?: number; defaultExpireTimeMs?: number }) {
    this.options = options;
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

  reset(): void {
    this.cache = new LRUCache({
      max: this.options?.maxSize,
      ttl: this.options?.defaultExpireTimeMs,
    });
  }
}

/**
 * quick-lru implementation
 */
class QuickLRUImpl implements CacheImplementation {
  name = 'quick-lru';
  private cache: QuickLRU<string, any>;
  private options?: { maxSize?: number; defaultExpireTimeMs?: number };

  constructor(options?: { maxSize?: number; defaultExpireTimeMs?: number }) {
    this.options = options;
    this.cache = new QuickLRU({
      maxSize: options?.maxSize || 1000,
      maxAge: options?.defaultExpireTimeMs ?? 3600000,
    });
  }

  set(key: string, value: any): void {
    this.cache.set(key, value);
  }

  get(key: string): any {
    return this.cache.get(key);
  }

  reset(): void {
    this.cache.clear();
    this.cache = new QuickLRU({
      maxSize: this.options?.maxSize || 1000,
      maxAge: this.options?.defaultExpireTimeMs ?? 3600000,
    });
  }
}

/**
 * memory-cache implementation
 */
class MemoryCacheImpl implements CacheImplementation {
  name = 'memory-cache';
  private options?: { maxSize?: number; defaultExpireTimeMs?: number };

  constructor(options?: { maxSize?: number; defaultExpireTimeMs?: number }) {
    this.options = options;
    // memory-cache doesn't have constructor options, we'll handle ttl in the set method
  }

  set(key: string, value: any): void {
    memoryCache.put(key, value, this.options?.defaultExpireTimeMs);
  }

  get(key: string): any {
    return memoryCache.get(key);
  }

  reset(): void {
    memoryCache.clear();
  }
}

/**
 * tiny-lru implementation
 */
class TinyLRUImpl implements CacheImplementation {
  name = 'tiny-lru';
  private cache: ReturnType<typeof tinyLru.lru>;
  private options?: { maxSize?: number; defaultExpireTimeMs?: number };

  constructor(options?: { maxSize?: number; defaultExpireTimeMs?: number }) {
    this.options = options;
    this.cache = tinyLru.lru(options?.maxSize || 1000, options?.defaultExpireTimeMs);
  }

  set(key: string, value: any): void {
    this.cache.set(key, value);
  }

  get(key: string): any {
    return this.cache.get(key);
  }

  reset(): void {
    this.cache.clear();
    this.cache = tinyLru.lru(this.options?.maxSize || 1000, this.options?.defaultExpireTimeMs);
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
   * Resets the cache to a clean state
   */
  resetCache(): void {
    this.cache.reset();
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
      this.cache.get(`key-${keyIndex}`);
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
          this.cache.get(`key-${keyIndex}`);
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

  /**
   * Benchmarks performance of fixed-size cache implementations
   * by repeatedly inserting the same keys
   */
  async benchmarkFixedSizeCache(
    uniqueKeysCount: number,
    totalOperations: number,
  ): Promise<number> {
    try {
      // First populate the cache with initial keys
      for (let i = 0; i < uniqueKeysCount; i++) {
        this.cache.set(`key-${i}`, `value-${i}`);
      }
      const start = performance.now();

      // Repeatedly insert the same keys
      for (let i = 0; i < totalOperations; i++) {
        // Use modulo to cycle through the same set of keys
        const keyIndex = i % uniqueKeysCount;
        this.cache.set(`key-${keyIndex}`, `updated-value-${i}`);

        // Occasionally check if the key exists (every 10 operations)
        if (i % 10 === 0) {
          this.cache.get(`key-${keyIndex}`);
        }
      }

      const end = performance.now();
      return end - start;
    } catch (error) {
      console.error(`Error in fixed size cache benchmark: ${error.message}`);
      return 0;
    }
  }

  /**
   * Benchmarks mixed get/set operations on a fixed-size cache
   */
  async benchmarkFixedSizeMixedOperations(
    uniqueKeysCount: number,
    totalOperations: number,
  ): Promise<number> {
    try {
      // First populate the cache with initial keys
      for (let i = 0; i < uniqueKeysCount; i++) {
        this.cache.set(`key-${i}`, `value-${i}`);
      }
      const start = performance.now();

      // Perform mixed operations
      for (let i = 0; i < totalOperations; i++) {
        // Use modulo to cycle through the same set of keys
        const keyIndex = i % uniqueKeysCount;
        const operation = Math.random() > 0.5 ? 'get' : 'set';

        if (operation === 'get') {
          this.cache.get(`key-${keyIndex}`);
        } else {
          this.cache.set(`key-${keyIndex}`, `updated-value-${i}`);
        }
      }

      const end = performance.now();
      return end - start;
    } catch (error) {
      console.error(
        `Error in fixed size mixed operations benchmark: ${error.message}`,
      );
      return 0;
    }
  }

  dispose() {
    if (this.cache.dispose) {
      this.cache.dispose();
    }
  }
}

// Format utility
const formatOpsPerSec = (count: number, timeMs: number) => {
  if (timeMs <= 0) return 'N/A';
  const opsPerSec = count / (timeMs / 1000);
  return opsPerSec >= 100000
    ? `${(opsPerSec / 1000000).toFixed(2)}M ops/sec`
    : `${opsPerSec.toFixed(0)} ops/sec`;
};

/**
 * Run benchmarks across all cache implementations
 */
async function runComparativeBenchmarks() {
  console.log('Comparative Cache Benchmarks\n');
  console.log('==========================\n');

  const cacheOptions = {
    maxSize: 10000,
    defaultExpireTimeMs: 3600000,
    purgeIntervalMs: null,
  };

  const cacheImplementations: CacheImplementation[] = [
    new NeocacheImpl(cacheOptions),
    new LRUCacheImpl(cacheOptions),
    new QuickLRUImpl(cacheOptions),
    new TinyLRUImpl(cacheOptions),
  ];

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
      benchmark.resetCache(); // Reset cache before benchmark
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
      benchmark.resetCache(); // Reset cache before benchmark
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
    benchmark.resetCache(); // Reset cache before benchmark
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
    benchmark.resetCache(); // Reset cache before benchmark
    const time = await benchmark.benchmarkLRUEviction(10000, ops);
    console.log(`${impl.name.padEnd(12)} | ${formatOpsPerSec(ops, time)}`);
    benchmark.dispose();
  }

  console.log('\n');

  console.log('Benchmark complete!');
}

async function runComparativeFixedSizeBenchmark() {
  // FIXED SIZE CACHE BENCHMARK (node-cache and memory-cache)
  console.log(
    'FIXED SIZE CACHE (10,000 unique keys, 100,000 total operations)',
  );
  console.log('─────────────────────────────────────────────────────────');
  console.log('Library      | Performance    ');
  console.log('─────────────────────────────');

  // Create specific implementations with max size set to 10,000
  const config = {
    maxSize: 10000,
    defaultExpireTimeMs: 3600000,
    purgeIntervalMs: null,
  };

  const fixedSizeCacheImpls = [
    new NodeCacheImpl(config),
    new MemoryCacheImpl(config),
    new LRUCacheImpl(config),
    new QuickLRUImpl(config),
    new TinyLRUImpl(config),
    new NeocacheImpl(config),
  ];

  for (const impl of fixedSizeCacheImpls) {
    const benchmark = new CacheBenchmark(impl);
    benchmark.resetCache();
    const uniqueKeysCount = 5000;
    const totalOperations = 1000000;
    const time = await benchmark.benchmarkFixedSizeCache(
      uniqueKeysCount,
      totalOperations,
    );
    console.log(
      `${impl.name.padEnd(12)} | ${formatOpsPerSec(totalOperations, time)}`,
    );
    benchmark.dispose();
  }

  console.log('\n');

  // FIXED SIZE CACHE MIXED OPERATIONS BENCHMARK
  console.log(
    'FIXED SIZE CACHE MIXED OPERATIONS (5,000 unique keys, 1,000,000 mixed get/set operations)',
  );
  console.log('─────────────────────────────────────────────────────────');
  console.log('Library      | Performance    ');
  console.log('─────────────────────────────');

  for (const impl of fixedSizeCacheImpls) {
    const benchmark = new CacheBenchmark(impl);
    benchmark.resetCache();
    const uniqueKeysCount = 5000;
    const totalOperations = 1000000;
    const time = await benchmark.benchmarkFixedSizeMixedOperations(
      uniqueKeysCount,
      totalOperations,
    );
    console.log(
      `${impl.name.padEnd(12)} | ${formatOpsPerSec(totalOperations, time)}`,
    );
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
    const impl = new NeocacheImpl({ maxSize: 10000 });
    const benchmark = new CacheBenchmark(impl);
    benchmark.resetCache(); // Reset cache before benchmark
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
    const impl = new NeocacheImpl();
    const benchmark = new CacheBenchmark(impl);
    benchmark.resetCache();
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
  const lruImpl = new NeocacheImpl();
  const lruBenchmark = new CacheBenchmark(lruImpl);
  lruBenchmark.resetCache();
  const lruEvictionTime = await lruBenchmark.benchmarkLRUEviction(
    100000,
    500000,
  );
  console.log(
    `LRU eviction with 100000 items cache adding 500000 items: ${lruEvictionTime.toFixed(
      2,
    )}ms (${(500000 / (lruEvictionTime / 1000)).toFixed(0)} ops/sec)`,
  );
  lruBenchmark.dispose();

  console.log('');

  // Mixed operations
  const mixedImpl = new NeocacheImpl({ maxSize: 500000 });
  const mixedBenchmark = new CacheBenchmark(mixedImpl);
  mixedBenchmark.resetCache();
  const mixedTime = await mixedBenchmark.benchmarkMixedOperations(500000);
  console.log(
    `Mixed 500000 operations (random get/set): ${mixedTime.toFixed(2)}ms (${(
      500000 /
      (mixedTime / 1000)
    ).toFixed(0)} ops/sec)`,
  );
  mixedBenchmark.dispose();
}

async function main() {
  if (process.argv.includes('--original')) {
    runOriginalBenchmarks().catch(console.error);
  } else {
    await runComparativeBenchmarks();
    await runComparativeFixedSizeBenchmark();
  }
}

main();
