const DEFAULT_EXPIRE_TIME_MS = 3600000;

type CacheEntry = {
  data: any;
  expireTime: number;
};

export class Neocache {
  static instance = new Neocache();

  private cache = new Map<string, CacheEntry>();
  async get(id: string, fetchFunc?: () => any) {
    if (!id) {
      return null;
    }
    const cache = this.cache[id];
    if (cache && cache.expireAt > Date.now()) {
      return cache.data;
    }

    if (!fetchFunc) {
      return null;
    }

    const data = await fetchFunc();
    this.set(id, data);
    return data;
  }

  /**
   * Returns a certain amount of random items from the cache.
   * They must not be expired.
   */
  async getRandomItems(count: number) {
    const keys = Object.keys(this.cache);
    const randomKeys = keys.sort(() => Math.random());
    const ret = [];
    while (ret.length < count && randomKeys.length > 0) {
      const key = randomKeys.pop();
      const cache = this.cache[key];
      if (cache.expireAt > Date.now()) {
        ret.push(cache.data);
      }
    }
    return ret;
  }

  set(id: string, data: any) {
    this.cache[id] = {
      data,
      expireAt: Date.now() + DEFAULT_EXPIRE_TIME_MS,
    };
  }

  invalidate(id: string) {
    delete this.cache[id];
  }
}

export default Neocache;
