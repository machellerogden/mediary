# Mediary

> Mediary implements structural sharing via proxies in order to provide a transparent virtualization for deep cloning.

Use Mediary's `clone` function to get an object representation which, for all intents and purposes, acts like a deeply cloned copy of your original data.

Getting and setting values on this object works natively. You're free to interact as you would with any normal object.

```js
const { clone } = require('mediary');

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

The difference between mediary's `clone` and a naïve deep cloning approach such as `JSON.parse(JSON.stringify(foo))` is that under the hood, any changes applied to the "cloned" object are transparently captured in an internal patch layer. The original object's data continues to be referenced for anything which has not been modified.

You can inspect this behavior for yourself using the `SymMeta` symbol which is exported from the package.

```
const { clone, SymMeta } = require('mediary');

const foo = {
    a: {
        b: 'b',
        c: 'c'
    }
};

const bar = clone(foo);

bar.a.d = 'd';

console.log(bar.a[SymMeta].patch); // => { d: 'd' }
```

In this case, an object with `d` was the only new value added to the patch. The rest of the object representation comes from the original object, `foo`.

*Important Note:* The original object will be deeply [frozen](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) upon cloning with Mediary. This is to ensure immutability of the new "cloned" object.

```
const { clone } = require('mediary');

const foo = {
    a: {
        b: 'b',
        c: 'c'
    }
};

const bar = clone(foo);

foo.a = "z";

console.log(foo); // => { a: { b: 'b', c: 'c' } }
```

It is recommended that you always `'use strict'` so that an error is thrown if you attempt to modify the original object.

```
'use strict';

const { clone } = require('mediary');

const foo = {
    a: {
        b: 'b',
        c: 'c'
    }
};

const bar = clone(foo);

foo.a = "z"; // => TypeError: Cannot assign to read only property 'a' of object '#<Object>'
```

# Benchmarks

See [./bench](https://github.com/machellerogden/mediary/tree/master/bench) directory for test setup. Test run is handled by [hbu](https://www.npmjs.com/package/hbu).

Results below are shown ordered by duration—shortest to longest.

_Tested on 2.6 GHz Intel Core i7 with 16 GB 2400 MHz DDR4 using Node v11.11.0_

Run them for yourself with: `npm run benchmark`

# Incremental Changes

This test simulates the real-world use case of adding small changes over time to a given object. 1000 such changes are made, each to a freshly cloned object. This is similar to how you might use cloning with a library such as [redux](https://redux.js.org/).

| Test Label                         | Duration (MS) | Heap Used (MB) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | ------------: | -------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| spread-incremental                 |       7.03947 |           1.97 |                  13.93 |                0.90412 |                 0 |                 9 |
| mediary-clone-incremental          |      12.39912 |           0.32 |                   5.83 |                0.44344 |                 0 |                 5 |
| mediary-produce-incremental        |      12.47772 |           0.37 |                   5.83 |                0.50751 |                 0 |                 5 |
| immer-incremental                  |     396.31582 |           8.00 |                 194.48 |                7.09438 |                 0 |                55 |

# Incremental Changes (in a single pass)

This test simulates the real-world use case of adding lots of small changes to a given object in a single pass. 1000 such changes are made to a single cloned object.

| Test Label                         | Duration (MS) | Heap Used (MB) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | ------------: | -------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| mediary-clone-incremental-single   |       3.12984 |           0.37 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-produce-incremental-single |       3.60566 |           0.38 |                   0.00 |                0.00000 |                 0 |                 0 |
| immer-incremental-single           |       5.59653 |           1.07 |                   0.00 |                0.00000 |                 0 |                 0 |

# Object Creation

This test forces a memory leak and push 1000 "clones" to an array.

Test data is a large single object (377 KB).

Four clone implementations are tested:

   * `immer(data, () = {})`
   * `mediary.mediary(data)`
   * `mediary.clone(data)`
   * `JSON.parse(JSON.stringify(data))`
   * `deepClone(data)` (see [./bench/deepclone-create](./bench/deepclone-create) for implementation)

| Test Label                         | Duration (MS) | Heap Used (MB) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | ------------: | -------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| immer-leak                         |       2.22033 |           0.98 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-clone-leak                 |      10.65097 |           2.94 |                  -0.52 |                1.05216 |                 0 |                 2 |
| stringify-leak                     |    1944.64302 |         146.26 |                 439.49 |               33.90690 |                 3 |                45 |
| deepclone-leak                     |    2211.25860 |         195.71 |                 797.54 |              131.44911 |                 6 |                65 |

# Property Get

This test reads every leaf on the large test object 1000 times.

Test data is a large single object (377 KB).

| Test Label                         | Duration (MS) | Heap Used (MB) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | ------------: | -------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| native-read                        |       6.78493 |           1.04 |                   0.00 |                0.00000 |                 0 |                 0 |
| proxy-read                         |       9.47038 |           1.00 |                   0.00 |                0.00000 |                 0 |                 0 |
| immer-read                         |    1579.61673 |           3.23 |                 570.50 |               14.19201 |                 0 |               147 |
| mediary-clone-read                 |    1653.33882 |           2.49 |                  46.59 |                2.74192 |                 0 |                14 |

# Property Set

This test set a new value to every leaf on the large test object 1000 times.

Test data is a large single object (377 KB).

| Test Label                         | Duration (MS) | Heap Used (MB) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | ------------: | -------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| native-write                       |    1435.62181 |          17.45 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-clone-write                |    4821.19282 |          15.71 |                5698.81 |              272.88216 |                 1 |               470 |
| immer-write                        |    5458.26703 |           9.72 |                2895.88 |               83.06379 |                 0 |               208 |

# License

MIT
