Comparative Cache Benchmarks

==========================

SET OPERATIONS
─────────────────────────────────────────────────────────
Library      | 100,000 items  | 1,000,000 items | 10,000,000 items
─────────────────────────────────────────────────────────
Neocache     | 2.64M ops/sec   | 4.91M ops/sec   | 4.89M ops/sec
lru-cache    | 1.83M ops/sec   | 3.94M ops/sec   | 3.88M ops/sec
quick-lru    | 3.87M ops/sec   | 4.50M ops/sec   | 4.36M ops/sec


GET OPERATIONS
─────────────────────────────────────────────────────────
Library      | 100,000 items  | 1,000,000 items | 10,000,000 items
─────────────────────────────────────────────────────────
Neocache     | 3.63M ops/sec   | 4.74M ops/sec   | 4.91M ops/sec
lru-cache    | 3.40M ops/sec   | 4.53M ops/sec   | 4.66M ops/sec
quick-lru    | 3.18M ops/sec   | 4.32M ops/sec   | 4.43M ops/sec


MIXED OPERATIONS (500,000 random get/set operations)
─────────────────────────────────────────────────────────
Library      | Performance
─────────────────────────────
Neocache     | 3.71M ops/sec
lru-cache    | 3.56M ops/sec
quick-lru    | 3.03M ops/sec


LRU EVICTION (adding 500,000 items to a cache of 10,000 items)
─────────────────────────────────────────────────────────
Library      | Performance
─────────────────────────────
Neocache     | 3.82M ops/sec
lru-cache    | 3.07M ops/sec
quick-lru    | 3.45M ops/sec


Benchmark complete!
FIXED SIZE CACHE (10,000 unique keys, 100,000 total operations)
─────────────────────────────────────────────────────────
Library      | Performance
─────────────────────────────
node-cache   | 2.93M ops/sec
memory-cache | 2.16M ops/sec
lru-cache    | 3.64M ops/sec
quick-lru    | 5.60M ops/sec
Neocache     | 5.61M ops/sec


FIXED SIZE CACHE MIXED OPERATIONS (5,000 unique keys, 1,000,000 mixed get/set operations)
─────────────────────────────────────────────────────────
Library      | Performance
─────────────────────────────
node-cache   | 2.62M ops/sec
memory-cache | 2.37M ops/sec
lru-cache    | 3.69M ops/sec
quick-lru    | 4.53M ops/sec
Neocache     | 4.53M ops/sec


Benchmark complete!
~/Projects/oss/neocache master                                                          х INT 53s 03:53:36 PM
❯

❯
❯ lg
❯
❯
❯ nr benchmark

> neocache@2.3.0 benchmark
> npx tsx src/benchmark.ts

(node:8818) ExperimentalWarning: CommonJS module /usr/local/lib/node_modules/npm/node_modules/debug/src/node.js is loading ES Module /usr/local/lib/node_modules/npm/node_modules/supports-color/index.js using require().
Support for loading ES Module in require() is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
Comparative Cache Benchmarks

==========================

/Users/jeanno/Projects/oss/neocache/src/benchmark.ts:201
    this.cache = lru(options?.maxSize || 1000, options?.defaultExpireTimeMs);
                 ^


TypeError: (0 , import_tiny_lru.default) is not a function
    at new TinyLRUImpl (/Users/jeanno/Projects/oss/neocache/src/benchmark.ts:201:18)
    at runComparativeBenchmarks (/Users/jeanno/Projects/oss/neocache/src/benchmark.ts:448:5)
    at main (/Users/jeanno/Projects/oss/neocache/src/benchmark.ts:697:11)
    at lru (/Users/jeanno/Projects/oss/neocache/src/benchmark.ts:702:1)
    at Object.<anonymous> (/Users/jeanno/Projects/oss/neocache/src/benchmark.ts:702:6)
    at Module._compile (node:internal/modules/cjs/loader:1546:14)
    at Object.transformer (/Users/jeanno/Projects/oss/neocache/node_modules/tsx/dist/register-DCnOAxY2.cjs:2:1186)
    at Module.load (node:internal/modules/cjs/loader:1303:32)
    at Function._load (node:internal/modules/cjs/loader:1117:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)

Node.js v23.3.0
❯ nr benchmark

> neocache@2.3.0 benchmark
> npx tsx src/benchmark.ts

(node:29054) ExperimentalWarning: CommonJS module /usr/local/lib/node_modules/npm/node_modules/debug/src/node.js is loading ES Module /usr/local/lib/node_modules/npm/node_modules/supports-color/index.js using require().
Support for loading ES Module in require() is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
Comparative Cache Benchmarks

==========================

SET OPERATIONS
─────────────────────────────────────────────────────────
Library      | 100,000 items  | 1,000,000 items | 10,000,000 items
─────────────────────────────────────────────────────────
Neocache     | 2.29M ops/sec   | 4.66M ops/sec   | 4.81M ops/sec
lru-cache    | 1.95M ops/sec   | 3.87M ops/sec   | 3.97M ops/sec
quick-lru    | 3.73M ops/sec   | 4.42M ops/sec   | 4.33M ops/sec
tiny-lru     | 1.63M ops/sec   | 1.45M ops/sec   | 1.44M ops/sec


GET OPERATIONS
─────────────────────────────────────────────────────────
Library      | 100,000 items  | 1,000,000 items | 10,000,000 items
─────────────────────────────────────────────────────────
Neocache     | 4.32M ops/sec   | 4.73M ops/sec   | 4.78M ops/sec
lru-cache    | 3.34M ops/sec   | 4.37M ops/sec   | 4.53M ops/sec
quick-lru    | 3.43M ops/sec   | 4.25M ops/sec   | 4.32M ops/sec
tiny-lru     | 1.81M ops/sec   | 2.63M ops/sec   | 2.24M ops/sec


MIXED OPERATIONS (500,000 random get/set operations)
─────────────────────────────────────────────────────────
Library      | Performance
─────────────────────────────
Neocache     | 3.64M ops/sec
lru-cache    | 3.58M ops/sec
quick-lru    | 2.76M ops/sec
tiny-lru     | 1.32M ops/sec


LRU EVICTION (adding 500,000 items to a cache of 10,000 items)
─────────────────────────────────────────────────────────
Library      | Performance
─────────────────────────────
Neocache     | 3.78M ops/sec
lru-cache    | 2.82M ops/sec
quick-lru    | 3.39M ops/sec
tiny-lru     | 1.22M ops/sec


Benchmark complete!
FIXED SIZE CACHE (10,000 unique keys, 100,000 total operations)
─────────────────────────────────────────────────────────
Library      | Performance
─────────────────────────────
node-cache   | 2.46M ops/sec
memory-cache | 1.88M ops/sec
lru-cache    | 3.62M ops/sec
quick-lru    | 5.81M ops/sec
tiny-lru     | 3.95M ops/sec
Neocache     | 5.42M ops/sec


FIXED SIZE CACHE MIXED OPERATIONS (5,000 unique keys, 1,000,000 mixed get/set operations)
─────────────────────────────────────────────────────────
Library      | Performance
─────────────────────────────
node-cache   | 2.80M ops/sec
memory-cache | 2.05M ops/sec
lru-cache    | 4.19M ops/sec
quick-lru    | 4.98M ops/sec
tiny-lru     | 3.25M ops/sec
Neocache     | 4.99M ops/sec


Benchmark complete!

