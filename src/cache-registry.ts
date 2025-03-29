import { Neocache } from './neocache';

type CacheOptions = {
  defaultExpireTimeMs?: number;
  purgeIntervalMs?: number;
  maxSize?: number;
};

export class CacheRegistry {
  private caches = new Map<string, Neocache>();
  private defaultOptions: CacheOptions;
  private statsReportingInterval: NodeJS.Timeout | null = null;

  constructor(defaultOptions?: CacheOptions) {
    this.defaultOptions = defaultOptions || {};
  }

  /**
   * Create a new cache with the given name
   * @throws Error if a cache with the name already exists
   */
  createCache(name: string, options?: CacheOptions): Neocache {
    if (this.caches.has(name)) {
      throw new Error(`Cache with name '${name}' already exists.`);
    }

    const cache = new Neocache({
      ...this.defaultOptions,
      ...options,
    });

    this.caches.set(name, cache);
    return cache;
  }

  /**
   * Get or create a cache with the given name
   */
  getCache(name: string, options?: CacheOptions): Neocache {
    if (!this.caches.has(name)) {
      this.caches.set(
        name,
        new Neocache({
          ...this.defaultOptions,
          ...options,
        }),
      );
    }
    return this.caches.get(name)!;
  }

  /**
   * Check if a cache with the given name exists
   */
  hasCache(name: string): boolean {
    return this.caches.has(name);
  }

  /**
   * Remove a cache with the given name
   */
  removeCache(name: string): boolean {
    if (this.caches.has(name)) {
      const cache = this.caches.get(name);
      cache.dispose();
      return this.caches.delete(name);
    }
    return false;
  }

  /**
   * Get all cache names
   */
  getCacheNames(): string[] {
    return Array.from(this.caches.keys());
  }

  /**
   * Get the number of registered caches
   */
  get size(): number {
    return this.caches.size;
  }

  reportStats(): void {
    this.caches.forEach((cache, name) => {
      console.log(`[CACHE STAT] '${name}': size=${cache.size}`);
    });
  }

  /**
   * Start reporting stats at the given interval
   */
  startReportingStats(intervalMs: number): void {
    // Clear any existing interval first
    this.stopReportingStats();

    this.statsReportingInterval = setInterval(() => {
      this.reportStats();
    }, intervalMs);
  }

  /**
   * Stop reporting stats
   */
  stopReportingStats(): void {
    if (this.statsReportingInterval) {
      clearInterval(this.statsReportingInterval);
      this.statsReportingInterval = null;
    }
  }
}

export default CacheRegistry;
