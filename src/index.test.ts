import Neocache from './index';

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
  expect(cache.length).toBe(1);
  await new Promise((resolve) => setTimeout(resolve, 30));
  expect(await cache.get('foo')).toBe('bar');
  expect(cache.length).toBe(1);
  await new Promise((resolve) => setTimeout(resolve, 30));
  expect(await cache.get('foo')).toBeNull();
  expect(cache.length).toBe(1);
  await new Promise((resolve) => setTimeout(resolve, 200));
  expect(cache.length).toBe(0);
  cache.dispose();
});
