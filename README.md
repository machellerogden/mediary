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
| mediary-incremental                |           0.31 |       2.02784 |                   0.00 |                0.00000 |                 0 |                 0 |
| immer-incremental                  |           8.00 |     340.08041 |                 194.48 |                7.27373 |                 0 |                55 |
| mediary-clone-incremental          |           4.89 |    4816.52020 |                2199.07 |               76.99472 |                 0 |               183 |
| mediary-produce-incremental        |           4.91 |    4842.62799 |                2225.47 |               81.92956 |                 0 |               184 |

# Incremental Changes (in a single pass)

This test simulates the real-world use case of adding lots of small changes to a given object in a single pass. 1000 such changes are made to a single cloned object.

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| mediary-incremental-single         |           0.20 |       1.64652 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-clone-incremental-single   |           0.20 |       1.69031 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-produce-incremental-single |           0.21 |       1.95007 |                   0.00 |                0.00000 |                 0 |                 0 |
| immer-incremental-single           |           1.07 |       5.28399 |                   0.00 |                0.00000 |                 0 |                 0 |

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
| immer-leak                         |           0.98 |       2.15324 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-leak                       |           2.23 |       9.64390 |                  -0.54 |                1.10065 |                 0 |                 2 |
| mediary-clone-leak                 |           2.25 |      10.15703 |                  -0.54 |                1.14705 |                 0 |                 2 |
| stringify-leak                     |         145.80 |    1868.81587 |                 439.54 |               32.01371 |                 3 |                45 |
| deepclone-leak                     |         195.74 |    2073.49292 |                 797.46 |              125.33657 |                 6 |                65 |

# Property Get

This test reads every leaf on the large test object 1000 times.

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| native-read                        |           1.04 |       6.85239 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-read                       |           2.78 |     731.62834 |                  -0.41 |                1.25681 |                 0 |                 2 |
| mediary-clone-read                 |           2.78 |     734.54918 |                  -0.43 |                1.19153 |                 0 |                 2 |
| immer-read                         |           3.26 |    1523.03042 |                 570.52 |               12.45514 |                 0 |               147 |

# Property Set

This test set a new value to every leaf on the large test object 1000 times.

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| native-write                       |          17.34 |    1340.17821 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-write                      |          15.00 |    2151.20631 |                5666.66 |              253.78840 |                 1 |               468 |
| mediary-clone-write                |          10.87 |    2170.76613 |                5667.04 |              255.38189 |                 1 |               469 |
| immer-write                        |           8.65 |    5575.52146 |                2896.82 |               79.27530 |                 0 |               208 |

# License

MIT
