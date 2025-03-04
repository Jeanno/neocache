type CacheItem = {
  data: any;
  expireTime: number;
};

type CacheItemOptions = {
  expireTimeMs?: number;
};

type CacheOptions = {
  defaultExpireTimeMs?: number;
  purgeIntervalMs?: number;
  maxSize?: number;
};

export class Neocache {
  static instance = new Neocache();

  private options: CacheOptions = {
    defaultExpireTimeMs: 3600000,
    purgeIntervalMs: 60000,
  };

  // Main cache storage - using Map which preserves insertion order for LRU
  private cache = new Map<string, CacheItem>();
  private oldCache = new Map<string, CacheItem>();

  private timeToKeyBucket = new Map<number, string[]>();
  private purgeExpiredTimer: NodeJS.Timeout | null = null;

  constructor(options?: CacheOptions) {
    if (options) {
      this.options = {
        ...this.options,
        ...options,
      };
    }
  }

  async get(id: string, fetchFunc?: () => any, options?: CacheItemOptions) {
    if (!id) {
      return null;
    }

    if (this.cache.has(id)) {
      const item = this.cache.get(id);
      if (item && item.expireTime > Date.now()) {
        this.cache.delete(id);
        this.cache.set(id, item);
        return item.data;
      }
    }

    if (this.oldCache.has(id)) {
      const item = this.oldCache.get(id);
      if (item && item.expireTime > Date.now()) {
        this.oldCache.delete(id);
        this.cache.set(id, item);
        return item.data;
      }
    }

    if (!fetchFunc) {
      return null;
    }

    const data = await fetchFunc();
    this.set(id, data, options);
    return data;
  }

  /**
   * Returns a certain amount of random items from the cache.
   * They must not be expired.
   */
  async getRandomItems(count: number) {
    const keys = Array.from(this.cache.keys());
    const randomKeys = keys.sort(() => Math.random() - 0.5);
    const ret = [];
    while (ret.length < count && randomKeys.length > 0) {
      const key = randomKeys.pop();
      const cache = this.cache.get(key);
      if (cache && cache.expireTime > Date.now()) {
        ret.push(cache.data);
      }
    }
    return ret;
  }

  set(id: string, data: any, options?: CacheItemOptions) {
    if (!id) {
      return;
    }

    this.oldCache.delete(id);

    // If this is an existing key, we need to remove it first to update the LRU order
    if (this.cache.has(id)) {
      this.cache.delete(id);
    } else if (this.options.maxSize) {
      if (this.cache.size >= this.options.maxSize) {
        this.oldCache = this.cache;
        this.cache = new Map<string, CacheItem>();
      }
    }

    const expireTimeMs =
      options?.expireTimeMs || this.options.defaultExpireTimeMs;
    const expireTime = Date.now() + expireTimeMs;

    this.cache.set(id, { data, expireTime });

    if (!this.options.purgeIntervalMs) {
      return;
    }
    const timeKey = Math.floor(expireTime / this.options.purgeIntervalMs) + 1;
    const keys = this.timeToKeyBucket.get(timeKey) ?? [];
    keys.push(id);
    this.timeToKeyBucket.set(timeKey, keys);

    this.setUpPurgeExpiredTimer();
  }

  invalidate(id: string) {
    this.cache.delete(id);
    this.oldCache.delete(id);
  }

  get size(): number {
    if (!this.cache.size) {
      return this.oldCache.size;
    }

    let size = this.oldCache.size;
    for (const key of this.cache.keys()) {
      if (!this.oldCache.has(key)) {
        size++;
      }
    }

    return Math.min(size, this.options.maxSize ?? Number.POSITIVE_INFINITY);
  }

  get keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Release expired items
  purgeExpired() {
    const now = Date.now();
    const timeKey = Math.floor(now / this.options.purgeIntervalMs);
    const keys = this.timeToKeyBucket.get(timeKey) ?? [];
    for (const key of keys) {
      const item = this.cache.get(key);
      if (item && item.expireTime < now) {
        this.invalidate(key);
      }
    }
    this.timeToKeyBucket.delete(timeKey);
  }

  setUpPurgeExpiredTimer() {
    if (!this.options.purgeIntervalMs) {
      return;
    }
    if (this.purgeExpiredTimer) {
      return;
    }
    const weakThis = new WeakRef(this);
    let timer = setInterval(() => {
      const self = weakThis.deref();
      if (self) {
        self.purgeExpired();
      } else {
        clearInterval(timer);
        timer = null;
      }
    }, this.options.purgeIntervalMs);

    this.purgeExpiredTimer = timer;
  }

  dispose() {
    if (this.purgeExpiredTimer) {
      clearInterval(this.purgeExpiredTimer);
      this.purgeExpiredTimer = null;
    }
  }
}

export default Neocache;
