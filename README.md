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

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| spread-incremental                 |           1.69 |       7.45157 |                  13.93 |                1.06188 |                 0 |                 9 |
| mediary-produce-incremental        |           8.48 |      17.23819 |                   8.78 |                3.87202 |                 1 |                 4 |
| mediary-clone-incremental          |           8.44 |      17.34739 |                   8.84 |                4.00099 |                 1 |                 4 |
| immer-incremental                  |           8.00 |     397.00700 |                 194.48 |                7.80491 |                 0 |                55 |

# Incremental Changes (in a single pass)

This test simulates the real-world use case of adding lots of small changes to a given object in a single pass. 1000 such changes are made to a single cloned object.

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| mediary-clone-incremental-single   |           0.37 |       3.44805 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-produce-incremental-single |           0.38 |       3.71879 |                   0.00 |                0.00000 |                 0 |                 0 |
| immer-incremental-single           |           1.32 |       5.58536 |                   0.00 |                0.00000 |                 0 |                 0 |

# Object Creation

This test forces a memory leak and push 1000 "clones" to an array.

Test data is a large single object (377 KB).

Four clone implementations are tested:

   * `immer(data, () = {})`
   * `mediary.mediary(data)`
   * `mediary.clone(data)`
   * `JSON.parse(JSON.stringify(data))`
   * `deepClone(data)` (see [./bench/deepclone-create](./bench/deepclone-create) for implementation)

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| immer-leak                         |           0.98 |       2.24051 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-clone-leak                 |           3.04 |      10.79104 |                  -0.48 |                0.86122 |                 0 |                 2 |
| stringify-leak                     |         146.26 |    1903.46948 |                 439.96 |               34.80431 |                 3 |                45 |
| deepclone-leak                     |         195.75 |    2171.71767 |                 797.50 |              131.89580 |                 6 |                65 |

# Property Get

This test reads every leaf on the large test object 1000 times.

Test data is a large single object (377 KB).

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| native-read                        |           1.04 |       7.17858 |                   0.00 |                0.00000 |                 0 |                 0 |
| proxy-read                         |           1.01 |       9.68881 |                   0.00 |                0.00000 |                 0 |                 0 |
| immer-read                         |           3.24 |    1604.75321 |                 570.51 |               13.29892 |                 0 |               147 |
| mediary-clone-read                 |           2.84 |    1721.76706 |                  46.37 |                2.78501 |                 0 |                14 |

# Property Set

This test set a new value to every leaf on the large test object 1000 times.

Test data is a large single object (377 KB).

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| native-write                       |          17.77 |    1383.08516 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-clone-write                |          16.83 |    4823.60701 |                5699.19 |              266.50205 |                 1 |               469 |
| immer-write                        |           9.98 |    5503.34177 |                2895.60 |               89.49375 |                 0 |               208 |

# License

MIT
