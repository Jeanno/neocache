# Neocache API Documentation

Neocache is a minimal, efficient in-memory cache library for Node.js applications. It provides a simple key-value store with features like automatic expiration, LRU (Least Recently Used) eviction, and configurable cache settings.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
  - [Neocache Class](#neocache-class)
  - [Configuration Options](#configuration-options)
  - [Methods](#methods)
  - [Cache Item Options](#cache-item-options)
- [Cache Strategies](#cache-strategies)
  - [Expiration](#expiration)
  - [LRU Eviction](#lru-eviction)
- [Benchmarking](#benchmarking)
- [Examples](#examples)
  - [Basic Caching](#basic-caching)
  - [Automatic Data Loading](#automatic-data-loading)
  - [LRU Cache for API Responses](#lru-cache-for-api-responses)

## Installation

```bash
npm install neocache
```

## Basic Usage

```javascript
import Neocache from 'neocache';
// For CommonJS
// const Neocache = require('neocache').default;

// Using the singleton instance
const cache = Neocache.instance;

// Or create a custom instance
const myCache = new Neocache({
  defaultExpireTimeMs: 3600000, // 1 hour
  purgeIntervalMs: 60000,       // 1 minute
  maxSize: 1000                 // Maximum items in cache
});

// Store a value in the cache
myCache.set('key', 'value');

// Retrieve a value
const value = await myCache.get('key');

// Retrieve with automatic fetching when missing
const data = await myCache.get('key', async () => {
  // This function only runs if the item isn't in cache or has expired
  return await fetchDataFromDatabase();
});

// Invalidate a cache item
myCache.invalidate('key');

// Clean up when done (stops background purging)
myCache.dispose();
```

## API Reference

### Neocache Class

#### Constructor

```typescript
constructor(options?: CacheOptions)
```

Creates a new Neocache instance with optional configuration.

- **options**: Optional configuration object (see [Configuration Options](#configuration-options))

#### Static Properties

- **instance**: `Neocache` - A singleton instance of Neocache for convenience

### Configuration Options

The `CacheOptions` object can include:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultExpireTimeMs` | number | 3600000 (1 hour) | Default expiration time for cache items in milliseconds |
| `purgeIntervalMs` | number | 60000 (1 minute) | How often to check for and remove expired items |
| `maxSize` | number | Infinity | Maximum number of items to store before LRU eviction kicks in |

### Methods

#### get

```typescript
async get(id: string, fetchFunc?: () => T | null, options?: CacheItemOptions): Promise<T | null>
```

Retrieves an item from the cache by ID. If the item doesn't exist or has expired, an optional fetch function can be provided to load the data.

- **id**: The unique identifier for the cache item
- **fetchFunc**: Optional function to call when the item isn't in cache or has expired
- **options**: Optional configuration for this specific cache item
- **Returns**: The cached data or null if not found and no fetchFunc provided

#### getRandomItems

```typescript
async getRandomItems(count: number): Promise<T[]>
```

Returns a specified number of random non-expired items from the cache.

- **count**: Number of random items to retrieve
- **Returns**: Array of random cache items (may be fewer than requested if not enough valid items exist)

#### set

```typescript
set(id: string, data: T, options?: CacheItemOptions): void
```

Stores an item in the cache.

- **id**: The unique identifier for the cache item
- **data**: The data to cache
- **options**: Optional configuration for this specific cache item

#### invalidate

```typescript
invalidate(id: string): void
```

Removes an item from the cache.

- **id**: The unique identifier for the cache item to remove

#### Properties

- **size**: `number` - Returns the current number of items in the cache
- **keys**: `string[]` - Returns an array of all cache keys

#### dispose

```typescript
dispose(): void
```

Stops the background purge timer and prepares the cache instance for cleanup.

### Cache Item Options

The `CacheItemOptions` object can include:

| Option | Type | Description |
|--------|------|-------------|
| `expireTimeMs` | number | Custom expiration time for this specific cache item in milliseconds |

## Cache Strategies

### Expiration

Neocache automatically expires items based on their configured expiration time:

1. Each item has an expiration time, either from its specific options or the cache's default
2. A background timer runs periodically to purge expired items
3. Items are also checked for expiration when accessed via `get()`

### LRU Eviction

When a maximum size is specified, Neocache uses Least Recently Used (LRU) eviction:

1. The cache tracks item usage order
2. When the maximum size is reached, the least recently used item is evicted
3. Item order is updated whenever an item is accessed or modified

## Benchmarking

Neocache includes built-in benchmarking capabilities to measure performance:

```javascript
import { CacheBenchmark } from 'neocache/dist/benchmark';

// Create a benchmark instance
const benchmark = new CacheBenchmark({
  maxSize: 10000,
  defaultExpireTimeMs: 3600000
});

// Measure set operations
const setTime = await benchmark.benchmarkSet(10000);
console.log(`Setting 10000 items: ${setTime.toFixed(2)}ms`);

// Measure get operations
const getTime = await benchmark.benchmarkGet(10000);
console.log(`Getting 10000 items: ${getTime.toFixed(2)}ms`);

// Measure LRU eviction
const lruTime = await benchmark.benchmarkLRUEviction(1000, 500);
console.log(`LRU eviction time: ${lruTime.toFixed(2)}ms`);

// Measure mixed operations
const mixedTime = await benchmark.benchmarkMixedOperations(5000);
console.log(`Mixed operations: ${mixedTime.toFixed(2)}ms`);

// Clean up
benchmark.dispose();
```

You can also run the included benchmark suite:

```bash
npm run benchmark
```

## Examples

### Basic Caching

```javascript
import Neocache from 'neocache';

const cache = Neocache.instance;

// Store a user in cache for 5 minutes
cache.set('user:123', { name: 'John', email: 'john@example.com' }, {
  expireTimeMs: 300000 // 5 minutes
});

// Later, retrieve the user
const user = await cache.get('user:123');
```

### Automatic Data Loading

```javascript
import Neocache from 'neocache';
import { fetchUserFromDatabase } from './database';

const userCache = new Neocache({
  defaultExpireTimeMs: 600000 // 10 minutes
});

async function getUser(userId) {
  return await userCache.get(`user:${userId}`, async () => {
    // This only executes if the user isn't in cache or has expired
    console.log(`Cache miss for user ${userId}, loading from database`);
    return await fetchUserFromDatabase(userId);
  });
}

// First call - will fetch from database
const user1 = await getUser(123);

// Second call - will use cached value
const user2 = await getUser(123);
```

### LRU Cache for API Responses

```javascript
import Neocache from 'neocache';
import { fetchApiData } from './api';

// Create a cache with a maximum of 100 responses
const apiCache = new Neocache({
  maxSize: 100,
  defaultExpireTimeMs: 3600000 // 1 hour
});

async function fetchDataWithCache(endpoint) {
  return await apiCache.get(endpoint, async () => {
    return await fetchApiData(endpoint);
  });
}
```