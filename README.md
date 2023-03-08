# Neocache

## Overview
Neocache is a minimal cache library.

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

let item = cache.get('itemId'); // returns null, since the cache starts out as empty

item = cache.get('itemId', async () => {
  // Put your data retrieval logic here.
  const value = await getYourItemValue('itemId');
  return value;
});

// Later...
// Although the data retriving function is provided, it is not called because
// the cached value is used.
item = cache.get('itemId', async () => {
  // Code is not executed here
  const value = await getYourItemValue('itemId');
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
const item = myCache.get('itemId', async () => {
  // ...
  return value;
});

```
