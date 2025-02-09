# Neocache

## Overview
Neocache is a minimal cache library.

https://www.npmjs.com/package/neocache

## Features

- Key-value based caching
- Custom expire time

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


