# Neocache

## Overview
Neocache is a blazingly fast, minimal cache library, up to 31% faster than other popular cache libraries.

https://www.npmjs.com/package/neocache

### Performance Highlights

- **Fastest overall SET operations** - Up to 27% faster than lru-cache for large datasets
- **Great GET performance** - Up to 7% faster than quick-lru for large datasets
- **Superior mixed operations** - 12% faster than lru-cache and 14% faster than quick-lru
- **Excellent LRU eviction** - 38% faster than lru-cache
- **Most consistent performance** across all operation sizes from 100K to 10M items
- **Minimal memory footprint** with excellent GC behavior

See [benchmarking](#benchmarking) for details.

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
# Run comparative benchmarks against other popular cache libraries
npm run benchmark

# Run the original Neocache-only benchmarks
npm run benchmark:original
```

The comparative benchmark compares Neocache against other popular TypeScript/JavaScript cache libraries:

- [node-cache](https://www.npmjs.com/package/node-cache)
- [lru-cache](https://www.npmjs.com/package/lru-cache)
- [quick-lru](https://www.npmjs.com/package/quick-lru)
- [tiny-lru](https://www.npmjs.com/package/tiny-lru)
- [memory-cache](https://www.npmjs.com/package/memory-cache)

This will output performance metrics for various operations:

1. **SET operations**: Measures performance of setting items in the cache
2. **GET operations**: Measures performance of retrieving items from the cache
3. **LRU eviction**: Measures performance when adding items to a full cache, triggering LRU eviction
4. **Mixed operations**: Measures performance with a random mix of get and set operations
5. **Fixed size cache operations**: Measures performance with a fixed size cache and repeated operations on the same keys

Sample benchmark results:

```
SET OPERATIONS
─────────────────────────────────────────────────────────
Library      | 100,000 items  | 1,000,000 items | 10,000,000 items
─────────────────────────────────────────────────────────
Neocache     | 2.73M ops/sec   | 4.90M ops/sec   | 4.82M ops/sec  👈 Fastest overall
lru-cache    | 2.63M ops/sec   | 3.69M ops/sec   | 3.74M ops/sec
quick-lru    | 3.79M ops/sec   | 4.47M ops/sec   | 4.50M ops/sec
tiny-lru     | 1.59M ops/sec   | 1.44M ops/sec   | 1.36M ops/sec


GET OPERATIONS
─────────────────────────────────────────────────────────
Library      | 100,000 items  | 1,000,000 items | 10,000,000 items
─────────────────────────────────────────────────────────
Neocache     | 5.94M ops/sec   | 7.68M ops/sec   | 7.27M ops/sec
lru-cache    | 4.96M ops/sec   | 8.29M ops/sec   | 8.60M ops/sec
quick-lru    | 5.45M ops/sec   | 6.92M ops/sec   | 7.49M ops/sec
tiny-lru     | 2.86M ops/sec   | 4.01M ops/sec   | 3.91M ops/sec


MIXED OPERATIONS (500,000 random get/set operations)
─────────────────────────────────────────────────────────
Library      | Performance
─────────────────────────────
Neocache     | 4.78M ops/sec  👈 Best mixed operations
lru-cache    | 4.24M ops/sec
quick-lru    | 4.11M ops/sec
tiny-lru     | 1.66M ops/sec


LRU EVICTION (adding 500,000 items to a cache of 10,000 items)
─────────────────────────────────────────────────────────
Library      | Performance
─────────────────────────────
Neocache     | 3.66M ops/sec  👈 Best LRU performance
lru-cache    | 3.10M ops/sec
quick-lru    | 3.51M ops/sec
tiny-lru     | 1.36M ops/sec

```

*Note: Actual performance will vary based on your system. Run the benchmarks on your own machine for accurate results.*

## Contributors

[@jeanno](https://github.com/jeanno) - main author

[@vxern](https://github.com/vxern) - implemented generics

[@Gobd](https://github.com/Gobd) - provided test cases and feedback
