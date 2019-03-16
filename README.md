# Mediary

> Mediary implements structural sharing via proxies in order to provide a transparent virtualization for deep cloning.

*WARNING:* This is an experiment. Use at your own risk.

Use Mediary's `clone` function to get an object representation which, for all intents and purposes, acts like a deeply cloned copy of your original data.

Getting and setting values on this object works natively. You're free to interact as you would with any normal object.

```js
const { clone } = require('.');

const foo = {
    a: {
        b: 'b',
        c: 'c'
    }
};

const bar = clone(foo);

bar.a.d = 'd';

console.log(foo); // => { a: { b: 'b', c: 'c' } }

console.log(bar); // => { a: { b: 'b', c: 'c', d: 'd'  } }
```

The difference is that under the hood, any changes applied to the object are transparently captured in an internal patch layer and the original objects data referenced for anything which has not been modified.

You can inspect this behavior for yourself using the a symbol which is exported from the package.

```
const { SymMeta } = require('.');

console.log(bar.a[SymMeta].patch); // => { d: 'd' }
```

In this case, an object with `d` was the only new value added to the patch. The rest of the object representation comes from the original object, `foo`.

*Warning:* The original object will be deeply frozen upon cloning with Mediary. This is to ensure immutability of the new "cloned" object.

```
foo.a = "z";

console.log(foo); // => { a: { b: 'b', c: 'c' } }
console.log(bar); // => { a: { b: 'b', c: 'c', d: 'd' } } 
```

It is recommended that you always `'use strict'` so that an error is thrown when you attempt to modify the original object.

```
'use strict';

foo.a = "z"; // => TypeError: Cannot assign to read only property 'a' of object '#<Object>'
```

# Benchmarks

See [./bench](https://github.com/machellerogden/mediary/tree/master/bench) directory for test setup. Test run is handled by [hbu](https://www.npmjs.com/package/hbu).

Using a large single object (377 KB) and 1000 iterations for each test.

Results below are shown ordered by duration—shortest to longest.

_Tested on 2.6 GHz Intel Core i7 with 16 GB 2400 MHz DDR4 using Node v11.11.0_

Run them for yourself with: `npm run benchmark`

# Incremental Changes

This test simulates the real-world use case of adding small changes over time to a given object. 1000 such changes are made, each to a freshly cloned object.

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| mediary-incremental                |           0.31 |       1.92545 |                   0.00 |                0.00000 |                 0 |                 0 |
| immer-incremental                  |           2.22 |     337.81584 |                 192.50 |                8.16256 |                 0 |                55 |
| mediary-clone-incremental          |           4.02 |    4163.32902 |                1877.62 |               66.35831 |                 0 |               164 |
| mediary-produce-incremental        |          11.49 |    4170.67647 |                1870.27 |               64.46807 |                 0 |               163 |

# Incremental Changes (in a single pass)

This test simulates the real-world use case of adding lots of small changes to a given object in a single pass. 1000 such changes are made to a single cloned object.

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| mediary-incremental-single         |           0.20 |       1.53881 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-produce-incremental-single |           0.21 |       1.87243 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-clone-incremental-single   |           0.20 |       1.87357 |                   0.00 |                0.00000 |                 0 |                 0 |
| immer-incremental-single           |           1.31 |       5.70892 |                   0.00 |                0.00000 |                 0 |                 0 |

# Object Creation

This test forces a memory leak and push 1000 "clones" to an array.

Four clone implementations are tested:

   * `immer(data, () = {})`
   * `mediary.mediary(data)`
   * `mediary.clone(data)`
   * `JSON.parse(JSON.stringify(data))`
   * `deepClone(data)` (see [./bench/deepclone-create](./bench/deepclone-create) for implementation)

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| immer-leak                         |           0.98 |       2.14450 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-leak                       |           1.88 |       3.24787 |                  -0.60 |                0.78933 |                 0 |                 1 |
| mediary-clone-leak                 |           1.88 |       3.53849 |                  -0.60 |                0.86650 |                 0 |                 1 |
| stringify-leak                     |         146.23 |    1823.62126 |                 439.43 |               33.61272 |                 3 |                45 |
| deepclone-leak                     |         198.25 |    2052.18435 |                 795.02 |              123.30953 |                 6 |                65 |

# Property Get

This test reads every leaf on the large test object 1000 times.

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| native-read                        |           1.03 |       6.65384 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-clone-read                 |           2.57 |     699.37543 |                  -0.41 |                1.78676 |                 0 |                 2 |
| mediary-read                       |           2.57 |     709.32986 |                  -0.41 |                1.43542 |                 0 |                 2 |
| immer-read                         |           3.23 |    1502.64188 |                 570.50 |               13.24639 |                 0 |               147 |

# Property Set

This test set a new value to every leaf on the large test object 1000 times.

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| native-write                       |          17.45 |    1336.10053 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-write                      |          10.93 |    2344.70804 |                5666.20 |              245.83734 |                 1 |               471 |
| mediary-clone-write                |          20.42 |    2382.25871 |                5666.10 |              254.56260 |                 1 |               471 |
| immer-write                        |           9.70 |    5526.28962 |                2895.96 |               85.65771 |                 0 |               208 |

# License

MIT
