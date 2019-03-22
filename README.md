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
| immer-incremental                  |           7.74 |     347.23381 |                 194.48 |                7.45506 |                 0 |                55 |
| mediary-clone-incremental          |          11.86 |    5073.50561 |                2224.01 |               79.00755 |                 0 |               185 |
| mediary-produce-incremental        |           8.50 |    5037.51590 |                2227.62 |               80.83375 |                 0 |               185 |

## Private WeakMap

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| immer-incremental                  |           8.00 |     343.79333 |                 194.48 |                7.11798 |                 0 |                55 |
| mediary-clone-incremental          |          43.76 |    5419.61577 |                1702.63 |              237.40556 |                14 |               130 |
| mediary-produce-incremental        |          44.44 |    5396.64809 |                1702.25 |              238.87295 |                14 |               130 |

## Partial Patching

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| immer-incremental                  |           7.74 |     344.78214 |                 194.48 |                7.12869 |                 0 |                55 |
| mediary-clone-incremental          |          45.58 |     412.15976 |                 109.22 |               18.67704 |                 1 |                19 |
| mediary-produce-incremental        |          45.47 |     416.51531 |                 109.15 |               19.09774 |                 1 |                19 |


# Incremental Changes (in a single pass)

This test simulates the real-world use case of adding lots of small changes to a given object in a single pass. 1000 such changes are made to a single cloned object.

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| mediary-clone-incremental-single   |           0.29 |       3.46611 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-produce-incremental-single |           0.30 |       3.79097 |                   0.00 |                0.00000 |                 0 |                 0 |
| immer-incremental-single           |           1.31 |       5.85721 |                   0.00 |                0.00000 |                 0 |                 0 |

## Private WeakMap

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| mediary-produce-incremental-single |           0.30 |       3.70727 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-clone-incremental-single   |           0.29 |       3.84360 |                   0.00 |                0.00000 |                 0 |                 0 |
| immer-incremental-single           |           1.07 |       5.28495 |                   0.00 |                0.00000 |                 0 |                 0 |

## Partial Patching

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| mediary-clone-incremental-single   |           0.29 |       3.45454 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-produce-incremental-single |           0.30 |       3.71804 |                   0.00 |                0.00000 |                 0 |                 0 |
| immer-incremental-single           |           1.31 |       5.79159 |                   0.00 |                0.00000 |                 0 |                 0 |


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
| immer-leak                         |           0.98 |       2.13926 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-clone-leak                 |           2.06 |       9.99937 |                  -0.52 |                1.30629 |                 0 |                 2 |
| stringify-leak                     |         146.26 |    1835.62634 |                 439.60 |               34.37743 |                 3 |                45 |
| deepclone-leak                     |         259.58 |    2011.54432 |                 803.89 |              125.62890 |                 6 |                65 |

## Private WeakMap

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| immer-leak                         |           0.98 |       2.21175 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-clone-leak                 |           1.50 |       8.46256 |                  -1.20 |                0.48123 |                 0 |                 1 |
| stringify-leak                     |         145.77 |    1847.85485 |                 439.97 |               33.09871 |                 3 |                45 |
| deepclone-leak                     |         258.94 |    2026.92697 |                 804.48 |              126.14200 |                 6 |                65 |

## Partial Patching

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| immer-leak                         |           0.98 |       2.24494 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-clone-leak                 |           0.98 |       7.06755 |                  -0.91 |                0.59240 |                 0 |                 1 |
| stringify-leak                     |         146.26 |    1840.40177 |                 439.58 |               34.46314 |                 3 |                45 |
| deepclone-leak                     |         259.95 |    2038.46453 |                 803.47 |              127.59714 |                 6 |                65 |

# Property Get

This test reads every leaf on the large test object 1000 times.

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| native-read                        |           1.05 |       6.70976 |                   0.00 |                0.00000 |                 0 |                 0 |
| immer-read                         |           3.23 |    1599.09688 |                 570.50 |               13.79786 |                 0 |               147 |
| mediary-clone-read                 |           2.36 |    2057.21240 |                 403.51 |               12.01392 |                 0 |               105 |

## Private WeakMap

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| native-read                        |           1.03 |       7.03793 |                   0.00 |                0.00000 |                 0 |                 0 |
| immer-read                         |           3.23 |    1519.60655 |                 570.50 |               14.37212 |                 0 |               147 |
| mediary-clone-read                 |           1.40 |    1860.57233 |                  46.99 |                2.52746 |                 0 |                14 |

## Partial Patching

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| native-read                        |           1.04 |       6.94583 |                   0.00 |                0.00000 |                 0 |                 0 |
| immer-read                         |           3.25 |    1511.85233 |                 570.52 |               13.83516 |                 0 |               147 |
| mediary-clone-read                 |           4.81 |    1706.64705 |                  47.36 |                2.40319 |                 0 |                14 |


# Property Set

This test set a new value to every leaf on the large test object 1000 times.

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| native-write                       |          17.42 |    1326.19832 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-clone-write                |          16.04 |    4544.58994 |                5718.08 |              258.70548 |                 1 |               473 |
| immer-write                        |           2.21 |    5275.65389 |                2903.41 |               85.99486 |                 0 |               209 |

## Private WeakMap

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| native-write                       |          17.53 |    1318.78917 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-clone-write                |          22.89 |    4510.11265 |                5698.78 |              261.19945 |                 1 |               472 |
| immer-write                        |           2.20 |    5275.35799 |                2903.47 |               85.21654 |                 0 |               209 |

## Partial Patching

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| native-write                       |          17.31 |    1320.47255 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-clone-write                |          18.50 |    4481.00057 |                5698.29 |              253.25251 |                 1 |               471 |
| immer-write                        |           2.82 |    5286.48554 |                2902.86 |               83.06682 |                 0 |               209 |


# License

MIT
