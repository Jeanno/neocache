# Neocache

## Overview
Neocache is a minimal cache library

https://www.npmjs.com/package/neocache

## Features

- Key-value based caching
- Multiple eviction strategy
  - Custom expire time
  - LRU (Least Recently Used)
- Configurable max size
- Built-in benchmarking

## Usage

### Basic

```
import Neocache from 'neocache';
// For CommonJS
// const Neocache = require('neocache').default;

const cache = Neocache.instance;

const cacheId = 'customCacheId';

let cachedItem = cache.get(cacheId); // returns null, since the cache starts out as empty

cachedItem = cache.get(cacheId, async () => {
  // Put your data retrieval logic here.
  // This function is executed when cache doesn't exist or expired.
  const value = await fetchDataFromDatabase('itemId');
  return value;
});

// Later...
// Although the data retriving function is provided, it is not called because
// the cached value is used.
cachedItem = cache.get(cachedId, async () => {

  // Code is not executed here
  const value = await fetchDataFromDatabase('itemId');
  return value;
});

```

### Custom cache
```
import Neocache from 'neocache';
// For CommonJS
// const Neocache = require('neocache').default;

// You can create multiple instance of Neocache instead of using the default.
const myCache = new Neocache();

const cacheId = 'customCacheId';
const cachedItem = myCache.get(cacheId, async () => {
  // ...
  return value;
});
```

```
import Neocache from 'neocache';

// You can also use custom configuration for expiration time and max size
const myCache = new Neocache({
  // Default time until items expire (in milliseconds)
  defaultExpireTimeMs: 3600000, // 1 hour
  
  // How often to check for and remove expired items (in milliseconds)
  purgeIntervalMs: 60000, // 1 minute
  
  // Maximum number of items to store in cache before LRU eviction
  maxSize: 1000
});
```

### LRU Eviction

The cache uses a Least Recently Used (LRU) eviction strategy. When the cache reaches its maximum size, the least recently used items will be evicted to make room for new items.

To enable LRU eviction, specify the `maxSize` option when creating a cache instance:

```javascript
const cache = new Neocache({
  maxSize: 1000 // Maximum 1000 items in cache
});
```

### Benchmarking

Neocache comes with built-in benchmarking capabilities. To run benchmarks:

```bash
npm run benchmark
```

This will output performance metrics for various operations, such as setting items, getting items, LRU eviction, and mixed operations.


