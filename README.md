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
| mediary-no-wrapper-incremental        |           0.62 |      81.27193 |                 167.67 |                4.87489 |                 0 |                62 |
| mediary-create-incremental            |           0.92 |      84.78776 |                 167.53 |                4.97121 |                 0 |                60 |
| immer-incremental                     |           7.74 |     350.02811 |                 194.49 |                7.84946 |                 0 |                55 |
| mediary-produce-incremental           |          11.50 |    3852.61011 |                3327.12 |              102.89240 |                 0 |               267 |

Mediary produce "realizes" the mediary object. This is an extremely expensive operation as shown in the benchmark results.

# Incremental Changes (in a single pass)

This test simulates the real-world use case of adding lots of small changes to a given object in a single pass. 1000 such changes are made to a single cloned object.

| Test Label                            | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ------------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| immer-incremental-single              |           1.31 |       5.38932 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-no-wrapper-incremental-single |           1.10 |      81.52746 |                 167.32 |                4.81829 |                 0 |                59 |
| mediary-create-incremental-single     |           1.11 |      81.74502 |                 167.32 |                4.47623 |                 0 |                59 |
| mediary-produce-incremental-single    |           1.93 |      86.06582 |                 167.40 |                4.75661 |                 0 |                59 |

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
| immer-leak                            |           0.98 |       2.16409 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-leak                          |           2.27 |       9.53191 |                  -0.57 |                1.07082 |                 0 |                 2 |
| stringify-leak                        |         145.80 |    1860.90812 |                 439.50 |               34.03300 |                 3 |                45 |
| deepclone-leak                        |         195.94 |    2080.24129 |                 797.28 |              127.44061 |                 6 |                65 |
| realize-leak                          |         710.43 |   15042.31074 |                7896.69 |             2627.72859 |                23 |               725 |

The moral of the story: don't realize a mediary object unless you have to. And you shouldn't ever have to.

# Property Get

This test reads every leaf on the large test object 1000 times.

| Test Label                            | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ------------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| native-read                           |           1.04 |       6.75869 |                   0.00 |                0.00000 |                 0 |                 0 |
| immer-read                            |           0.21 |       9.78915 |                  -1.79 |                0.26626 |                 0 |                 1 |
| mediary-read                          |           8.96 |    6812.03345 |                5658.29 |              255.90069 |                 1 |               406 |
| realize-read                          |          22.78 |   12049.86087 |                8585.32 |             1560.97019 |                87 |               659 |

There is obviously a significant trade off in time complexity with propery access using mediary and it obviously puts tremendous pressure on the garbage collector.

Performance degradation here is due to the proxied representations which are created at the time of accessing any given property. This is where Mediary does the most work in trying to remain transparent to the user.

This performance is not where it needs to be and is being working on.

# Property Set

This test set a new value to every leaf on the large test object 1000 times.

| Test Label                            | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ------------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| native-write                          |          17.65 |    1356.19722 |                5658.90 |              250.42288 |                 1 |               471 |
| mediary-write                         |          15.37 |    4660.59500 |                5735.95 |              254.60823 |                 1 |               474 |
| immer-write                           |          12.66 |    5309.32262 |                2893.00 |               82.96756 |                 0 |               209 |
| realize-write                         |          40.15 |   11832.13345 |                8709.41 |             1554.23078 |                85 |               667 |

# License

MIT
