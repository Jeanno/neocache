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
};

export class Neocache {
  static instance = new Neocache();

  private options: CacheOptions = {
    defaultExpireTimeMs: 3600000,
    purgeIntervalMs: 60000,
  };

  private cache = new Map<string, CacheItem>();

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
    const cache = this.cache.get(id);
    if (cache && cache.expireTime > Date.now()) {
      return cache.data;
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
    const randomKeys = keys.sort(() => Math.random());
    const ret = [];
    while (ret.length < count && randomKeys.length > 0) {
      const key = randomKeys.pop();
      const cache = this.cache.get(key);
      if (cache.expireTime > Date.now()) {
        ret.push(cache.data);
      }
    }
    return ret;
  }

  set(id: string, data: any, options?: CacheItemOptions) {
    if (!id) {
      return;
    }

    const expireTimeMs =
      options?.expireTimeMs || this.options.defaultExpireTimeMs;
    const expireTime = Date.now() + expireTimeMs;
    this.cache.set(id, { data, expireTime });

    const timeKey = Math.floor(expireTime / this.options.purgeIntervalMs) + 1;
    const keys = this.timeToKeyBucket.get(timeKey) ?? [];
    keys.push(id);
    this.timeToKeyBucket.set(timeKey, keys);

    this.setUpPurgeExpiredTimer();
  }

  invalidate(id: string) {
    this.cache.delete(id);
  }

  get size(): number {
    return this.cache.size;
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
