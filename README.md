# Mediary

> Deep "clone" without the memory complexity.

*WARNING:* This is an experiment. Use at your own risk.

Mediary implements structural sharing via proxies in order to provide a transparent virtualization for deep cloning with low memory usage and reasonable performance characteristics.

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

# Differences from Immer

I read the Immer source after I finished writing the first draft of Mediary and I was surprise how similar the approach was. Both use Proxies and maintain an internal layer for patching change to objects. The main difference between Immer and Mediary is that Mediary exposes a more primitive layer than Immer. By exposing this layer, Mediary allows you to easily bake structural sharing into other libraries and projects. That said, if you prefer to Immer's usage pattern, Mediary exports a `produce` function.

```
const { produce } = require('mediary');

const foo = {
    a: {
        b: 'b',
        c: 'c'
    }
};

const bar = produce(foo, draft => {
    draft.a.d = 'd';
    return draft;
});

console.log(foo); // => { a: { b: 'b', c: 'c' } }

console.log(bar); // => { a: { b: 'b', c: 'c', d: 'd'  } }
```

# Benchmarks

See [./bench](https://github.com/machellerogden/mediary/tree/master/bench) directory for test setup. Test run is handled by [hbu](https://www.npmjs.com/package/hbu).

Using a large single object (377 KB) and 1000 iterations for each test.

_Tested on 2.6 GHz Intel Core i7 with 16 GB 2400 MHz DDR4 using Node v11.11.0_

Run them for yourself with: `npm run benchmark`

# Incremental Changes

This test simulates the real-world use case of adding small changes over time to a given object. 1000 such changes are made, each to a freshly cloned object.

| Test Label                            | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ------------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| mediary-create-incremental            |           2.45 |     232.24389 |                 166.74 |               33.00197 |                 0 |                60 |
| mediary-no-wrapper-incremental        |           0.71 |     232.94262 |                 168.60 |               21.83293 |                 0 |                60 |
| immer-incremental                     |           5.29 |     803.68613 |                 190.70 |               42.62420 |                 0 |                54 |
| mediary-produce-incremental           |           6.14 |    7108.61646 |                3334.10 |              264.66534 |                 0 |               274 |

# Incremental Changes (in a single pass)

This test simulates the real-world use case of adding lots of small changes to a given object in a single pass. 1000 such changes are made to a single cloned object.

| Test Label                            | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ------------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| mediary-no-wrapper-incremental-single |           0.15 |       4.17549 |                   0.00 |                0.00000 |                 0 |                 0 |
| immer-incremental-single              |           1.50 |      34.43458 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-create-incremental-single     |           1.52 |     247.02509 |                 166.49 |               62.53377 |                 0 |                59 |
| mediary-produce-incremental-single    |           2.47 |     247.42729 |                 167.26 |               31.13656 |                 0 |                59 |

# Object Creation

This test forces a memory leak and push 1000 "clones" to an array.

Four clone implementations are tested:

   * `mediary.clone(data)`
   * `immer(data, () = {})`
   * `deepClone(data)` (see [./bench/deepclone-create](./bench/deepclone-create) for implementation)
   * `JSON.parse(JSON.stringify(data))`
   * `mediary.realize(mediary.clone(data))`

| Test Label                            | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ------------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| immer-leak                            |           0.64 |      61.95657 |                  -1.42 |               12.15577 |                 0 |                 1 |
| mediary-leak                          |           2.27 |      73.69587 |                  -0.22 |               14.36987 |                 0 |                 3 |
| stringify-leak                        |         141.79 |    4225.32432 |                 490.14 |               78.94483 |                 3 |                48 |
| deepclone-leak                        |           0.36 |    4702.56784 |                1045.27 |              290.69014 |                 7 |                67 |
| realize-leak                          |         465.69 |   13756.62862 |                8145.57 |             1155.52394 |                 5 |               630 |


Immer fars the best but mediary is a close second with around twice the space and time complexity.

# Property Get

This test reads every leaf on the large test object 1000 times.

| Test Label                            | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ------------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| native-read                           |           1.48 |      31.37225 |                   0.00 |                0.00000 |                 0 |                 0 |
| immer-read                            |           1.55 |      34.87931 |                  -1.43 |                1.26944 |                 0 |                 1 |
| mediary-read                          |           1.91 |   10464.81967 |                5658.87 |              544.56020 |                 1 |               407 |
| realize-read                          |          18.21 |   13582.51448 |                8593.94 |              925.27228 |                17 |               630 |

There is obviously a significant trade off in time complexity with propery access using mediary.

Mediary also has slightly higher space complexity, though not significant.

Performance degradation here is due to the proxied representations which are created at the time of accessing any given property. This is where Mediary does the most work.

This performance is not where I want it to be and is being working on.

# Property Set

This test set a new value to every leaf on the large test object 1000 times.

| Test Label                            | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ------------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| native-write                          |           6.25 |    2664.25531 |                5650.11 |              511.36048 |                 1 |               469 |
| immer-write                           |           9.88 |    8873.15651 |                2805.30 |              137.01767 |                 0 |               203 |
| mediary-write                         |           2.56 |    8163.23233 |                5728.72 |              414.54735 |                 1 |               476 |
| realize-write                         |           3.02 |   13188.34618 |                8695.57 |              845.90822 |                 5 |               643 |

Here, mediary wins on space complexity but takes a hit on time complexity. That said, the minor slow down should be an acceptable trade off for most applications.

# License

MIT
