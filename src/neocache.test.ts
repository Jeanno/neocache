import Neocache from './neocache';

jest.setTimeout(10000);

test('smoke test', () => {
  expect(true).toBe(true);
});

test('get', async () => {
  const cache = new Neocache();
  expect(await cache.get('foo')).toBeNull();
  const data = await cache.get('foo', () => 'bar');
  expect(data).toBe('bar');
  cache.dispose();
});

test('singleton', () => {
  const cache1 = Neocache.instance;
  const cache2 = Neocache.instance;
  expect(cache1).toBe(cache2);
  expect(cache1).toBeInstanceOf(Neocache);
  // Not null or undefined
  expect(cache1).toBeTruthy();
  cache1.dispose();
});

test('expire time', async () => {
  const cache = new Neocache();
  const data = await cache.get('foo', () => 'bar', { expireTimeMs: 50 });
  expect(data).toBe('bar');
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(await cache.get('foo')).toBeNull();
  cache.dispose();
});

test('purge expired', async () => {
  const cache = new Neocache({
    defaultExpireTimeMs: 50,
    purgeIntervalMs: 100,
  });
  const data = await cache.get('foo', () => 'bar');
  expect(data).toBe('bar');
  expect(cache.size).toBe(1);
  await new Promise((resolve) => setTimeout(resolve, 30));
  expect(await cache.get('foo')).toBe('bar');
  expect(cache.size).toBe(1);
  await new Promise((resolve) => setTimeout(resolve, 30));
  expect(await cache.get('foo')).toBeNull();
  expect(cache.size).toBe(1);
  await new Promise((resolve) => setTimeout(resolve, 200));
  expect(cache.size).toBe(0);
  cache.dispose();
});

test('LRU eviction - maxSize limit', async () => {
  const cache = new Neocache({
    maxSize: 3,
  });

  // Add items to fill the cache
  await cache.get('item1', () => 'value1');
  await cache.get('item2', () => 'value2');
  await cache.get('item3', () => 'value3');

  expect(cache.size).toBe(3);

  // Access item1 to make it most recently used
  await cache.get('item1');

  // Add a new item, should evict the least recently used (item2)
  await cache.get('item4', () => 'value4');
  await cache.get('item5', () => 'value5');

  expect(cache.size).toBe(3);
  expect(await cache.get('item1')).toBe('value1');
  expect(await cache.get('item4')).toBe('value4');
  expect(await cache.get('item5')).toBe('value5');

  await cache.get('item1');
  await cache.get('item6', () => 'value6');
  await cache.get('item7', () => 'value7');
  expect(await cache.get('item1')).toBe('value1');
  expect(await cache.get('item2')).toBeNull();

  cache.dispose();
});

test('LRU order updates on access', async () => {
  const cache = new Neocache({
    maxSize: 3,
  });

  // Fill the cache
  await cache.get('item1', () => 'value1');
  await cache.get('item2', () => 'value2');
  await cache.get('item3', () => 'value3');

  // Access item1 to make it most recently used
  await cache.get('item1');

  // Access item2 to make it most recently used
  await cache.get('item2');

  // Add a new item, should evict the least recently used (item3)
  await cache.get('item4', () => 'value4');

  expect(cache.size).toBe(3);
  expect(await cache.get('item1')).toBe('value1'); // Should still exist
  expect(await cache.get('item2')).toBe('value2'); // Should still exist
  expect(await cache.get('item4')).toBe('value4'); // Should exist

  cache.dispose();
});

test('invalidate removes item from LRU tracking', async () => {
  const cache = new Neocache({
    maxSize: 3,
  });

  // Fill the cache
  await cache.get('item1', () => 'value1');
  await cache.get('item2', () => 'value2');
  await cache.get('item3', () => 'value3');

  // Manually invalidate an item
  cache.invalidate('item2');

  // Add a new item
  await cache.get('item4', () => 'value4');

  expect(cache.size).toBe(3);
  expect(await cache.get('item1')).toBe('value1');
  expect(await cache.get('item2')).toBeNull(); // Should be invalidated
  expect(await cache.get('item3')).toBe('value3');
  expect(await cache.get('item4')).toBe('value4');

  cache.dispose();
});

test('LRU should keep less than 2x the max size', async () => {
  const cache = new Neocache({ maxSize: 2 });
  for (let i = 0; i < 200; i++) {
    cache.set(`key-${i}`, `value-${i}`);
    let goodKeys = 0;
    for (let j = 0; j <= i; j++) {
      const v = await cache.get(`key-${j}`);
      if (v) {
        goodKeys++;
      }
    }
    expect(goodKeys).toBeLessThanOrEqual(4);
  }
});

test('expired items free up slots for new items', async () => {
  const cache = new Neocache({
    maxSize: 3,
  });

  // Fill the cache with different expiration times
  await cache.get('item1', () => 'value1', { expireTimeMs: 50 }); // This will expire quickly
  await cache.get('item2', () => 'value2', { expireTimeMs: 1000 }); // This won't expire during test
  await cache.get('item3', () => 'value3', { expireTimeMs: 1000 }); // This won't expire during test

  expect(cache.size).toBe(3);

  // Wait for item1 to expire
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Try to get item1 (should be expired)
  expect(await cache.get('item1')).toBeNull();

  // Add a new item - should be able to add without evicting non-expired items
  await cache.get('item4', () => 'value4');

  expect(cache.size).toBe(3);
  expect(await cache.get('item1')).toBeNull(); // Expired
  expect(await cache.get('item2')).toBe('value2'); // Should still exist (not expired)
  expect(await cache.get('item3')).toBe('value3'); // Should still exist (not expired)
  expect(await cache.get('item4')).toBe('value4'); // Should exist (took item1's slot)

  cache.dispose();
});

test('cache registry helper', () => {
  const registry = Neocache.cacheRegistry;
  expect(registry).toBeTruthy();
});

test('LRU with large cache (maxSize 1000)', async () => {
  const cache = new Neocache({ maxSize: 1000 });

  // Fill the cache with twice as many items as maxSize
  for (let i = 0; i < 2000; i++) {
    cache.get(`key-${i}`, () => `value-${i}`);
  }

  const size = cache.size;
  expect(size).toBeLessThanOrEqual(1000);

  cache.dispose();
});

test('LRU with large cache using cache registry', async () => {
  const registry = Neocache.cacheRegistry;
  const cacheId = 'largeRegistryCache';

  // Create a cache through the registry with maxSize 1000
  const config = {
    defaultExpireTimeMs: 60 * 60 * 1000,
    purgeIntervalMs: 600 * 1000,
    maxSize: 1000,
  };
  const cache = registry.createCache(cacheId, config);

  // Fill the cache with twice as many items as maxSize
  for (let i = 0; i < 2000; i++) {
    const randomKey = `key-${Math.floor(Math.random() * i)}`;

    await cache.get(randomKey, () => `value-${randomKey}`);
    if (i % 100 === 0) {
      const size = cache.size;
      expect(size).toBeLessThanOrEqual(1000);
    }
  }

  cache.dispose();
});
