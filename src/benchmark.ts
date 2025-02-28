import Neocache from './index';
import { performance } from 'perf_hooks';

/**
 * A simple benchmarking utility for Neocache
 */
class CacheBenchmark {
  private cache: Neocache;

  constructor(options?: {
    maxSize?: number;
    defaultExpireTimeMs?: number;
    purgeIntervalMs?: number;
  }) {
    this.cache = new Neocache(options);
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
    // First populate the cache
    for (let i = 0; i < count; i++) {
      this.cache.set(`key-${i}`, `value-${i}`);
    }
    
    const start = performance.now();
    
    for (let i = 0; i < count; i++) {
      await this.cache.get(`key-${i}`);
    }
    
    const end = performance.now();
    return end - start;
  }

  /**
   * Measures the time for LRU eviction with a full cache
   */
  async benchmarkLRUEviction(cacheSize: number, operationCount: number): Promise<number> {
    // Create a cache with limited size
    const lruCache = new Neocache({ maxSize: cacheSize });
    
    // Fill the cache to capacity
    for (let i = 0; i < cacheSize; i++) {
      lruCache.set(`key-${i}`, `value-${i}`);
    }
    
    const start = performance.now();
    
    // Add more items to trigger LRU eviction
    for (let i = 0; i < operationCount; i++) {
      lruCache.set(`new-key-${i}`, `new-value-${i}`);
    }
    
    const end = performance.now();
    lruCache.dispose();
    return end - start;
  }

  /**
   * Measures the time for mixed operations (get/set) with random access patterns
   */
  async benchmarkMixedOperations(operationCount: number): Promise<number> {
    const start = performance.now();
    
    for (let i = 0; i < operationCount; i++) {
      const operation = Math.random() > 0.5 ? 'get' : 'set';
      const keyIndex = Math.floor(Math.random() * operationCount);
      
      if (operation === 'get') {
        await this.cache.get(`key-${keyIndex}`);
      } else {
        this.cache.set(`key-${keyIndex}`, `value-${i}`);
      }
    }
    
    const end = performance.now();
    return end - start;
  }

  dispose() {
    this.cache.dispose();
  }
}

/**
 * Run benchmarks and print results
 */
async function runBenchmarks() {
  console.log('Running Neocache Benchmarks...\n');
  
  // Basic set operations
  const setOperations = [1000, 10000, 100000];
  for (const count of setOperations) {
    const benchmark = new CacheBenchmark();
    const time = await benchmark.benchmarkSet(count);
    console.log(`Setting ${count} items: ${time.toFixed(2)}ms (${(count / (time / 1000)).toFixed(0)} ops/sec)`);
    benchmark.dispose();
  }
  
  console.log('');
  
  // Basic get operations
  const getOperations = [1000, 10000, 100000];
  for (const count of getOperations) {
    const benchmark = new CacheBenchmark();
    const time = await benchmark.benchmarkGet(count);
    console.log(`Getting ${count} items: ${time.toFixed(2)}ms (${(count / (time / 1000)).toFixed(0)} ops/sec)`);
    benchmark.dispose();
  }
  
  console.log('');
  
  // LRU eviction benchmark
  const lruBenchmark = new CacheBenchmark();
  const lruEvictionTime = await lruBenchmark.benchmarkLRUEviction(10000, 5000);
  console.log(`LRU eviction with 10000 items cache adding 5000 items: ${lruEvictionTime.toFixed(2)}ms (${(5000 / (lruEvictionTime / 1000)).toFixed(0)} ops/sec)`);
  lruBenchmark.dispose();
  
  console.log('');
  
  // Mixed operations
  const mixedBenchmark = new CacheBenchmark({ maxSize: 50000 });
  const mixedTime = await mixedBenchmark.benchmarkMixedOperations(50000);
  console.log(`Mixed 50000 operations (random get/set): ${mixedTime.toFixed(2)}ms (${(50000 / (mixedTime / 1000)).toFixed(0)} ops/sec)`);
  mixedBenchmark.dispose();
}

// Run the benchmarks when this file is executed directly
if (require.main === module) {
  runBenchmarks().catch(console.error);
}

export { CacheBenchmark };