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

See [./bench](https://github.com/machellerogden/mediary/tree/master/bench) directory for test setup.

Using a large single object (377 KB) and 1000 iterations for each test.

_Tested on 2.6 GHz Intel Core i7 with 16 GB 2400 MHz DDR4 using Node v11.11.0_

Run them for yourself with: `npm run benchmark`

# Incremental Changes

This test simulates the real-world use case of adding small changes over time to a given object. 1000 such changes are made, each to a freshly cloned object.

| Label                          | Heap Used          | Elapsed Time             |
| ------------------------------ | :----------------: | :----------------------: |
| mediary-no-wrapper-incremental |         1.5 MB     |           91.942994 MS   |
| mediary-create-incremental     |         1.5 MB     |           86.324569 MS   |
| immer-incremental              |         7.34 MB    |          349.310175 MS   |
| mediary-produce-incremental    |        12.37 MB    |         3861.95169 MS    |

# Incremental Changes (in a single pass)

This test simulates the real-world use case of adding lots of small changes to a given object in a single pass. 1000 such changes are made to a single cloned object.

| Label                                 | Heap Used          | Elapsed Time             |
| ------------------------------------- | :----------------: | :----------------------: |
| mediary-no-wrapper-incremental-single |         0.59 MB    |            3.026253 MS   |
| immer-incremental-single              |         1.04 MB    |           10.417299 MS   |
| mediary-create-incremental-single     |         1.34 MB    |           88.415071 MS   |
| mediary-produce-incremental-single    |         1.97 MB    |           88.803305 MS   |

# Object Creation

This test forces a memory leak and push 1000 "clones" to an array.

Four clone implementations are tested:

   * `mediary.clone(data)`
   * `immer(data, () = {})`
   * `deepClone(data)` (see [./bench/deepclone-create](./bench/deepclone-create) for implementation)
   * `JSON.parse(JSON.stringify(data))`
   * `mediary.realize(mediary.clone(data))`


| Label          | Heap Used          | Elapsed Time             |
| -------------- | :----------------: | :----------------------: |
| immer-leak     |         1.5 MB     |            8.272445 MS   |
| mediary-leak   |         3.27 MB    |           16.393244 MS   |
| deepclone-leak |       242.95 MB    |         2344.658957 MS   |
| stringify-leak |       142.34 MB    |         2246.91812 MS    |
| realize-leak   |       718.29 MB    |        12061.998137 MS   |


Immer fars the best but mediary is a close second with around twice the space and time complexity.

# Property Get

This test reads every leaf on the large test object 1000 times.

| Label        | Heap Used          | Elapsed Time             |
| ------------ | :----------------: | :----------------------: |
| native-read  |         1.52 MB    |           11.419873 MS   |
| immer-read   |         1.12 MB    |           18.724774 MS   |
| mediary-read |        14.02 MB    |         6865.220457 MS   |
| realize-read |         0.45 MB    |        11674.012832 MS   |

There is obviously a significant trade off in time complexity with propery access using mediary.

Mediary also has slightly higher space complexity, though not significant.

Performance degradation here is due to the proxied representations which are created at the time of accessing any given property. This is where Mediary does the most work.

This performance is not where I want it to be and is being working on.

# Property Set

This test set a new value to every leaf on the large test object 1000 times.

| Label         | Heap Used          | Elapsed Time             |
| ------------- | :----------------: | :----------------------: |
| native-write  |        20.57 MB    |         1373.10171 MS    |
| mediary-write |         8.13 MB    |         4846.20946 MS    |
| immer-write   |         9.38 MB    |         5159.069721 MS   |
| realize-write |         0.45 MB    |        11709.913678 MS   |

Here, mediary wins on space complexity but takes a hit on time complexity. That said, the minor slow down should be an acceptable trade off for most applications.

# License

MIT


# Updated Benchmarks

| Test Label                            | Heap Used (MB)  | Duration (MS)     | GC Events | GC Collected Heap (MB) | GC Pause Duration (MS) |
| ------------------------------------- | :-------------: | :---------------: | --------- | :--------------------: | ---------------------- |
| immer-incremental-single              |         0.15    |        26.800015  | 1         |             -1.14      | 1                      |
| mediary-create-incremental-single     |         3.17    |       267.243636  | 57        |            166.57      | 59                     |
| mediary-no-wrapper-incremental-single |         0.18    |         5.388965  | 0         |              0         | 0                      |
| mediary-produce-incremental-single    |         1.71    |       256.692791  | 57        |            168.36      | 55                     |
| immer-incremental                     |         5.85    |       845.457483  | 52        |            190.47      | 76                     |
| mediary-create-incremental            |         3.17    |       257.740382  | 56        |            166.66      | 61                     |
| mediary-no-wrapper-incremental        |         2.18    |       259.966598  | 57        |            167.55      | 24                     |
| mediary-produce-incremental           |        11.61    |      7539.247486  | 269       |           3329.73      | 256                    |
| deepclone-leak                        |       208.19    |      4947.248631  | 83        |            838.25      | 321                    |
| immer-leak                            |         0.66    |        61.136418  | 1         |             -1.08      | 10                     |
| mediary-leak                          |         1.67    |        48.720062  | 3         |              0.6       | 22                     |
| realize-leak                          |       458.39    |     14638.431263  | 642       |           8153.37      | 1249                   |
| stringify-leak                        |       139.19    |      4623.96392   | 57        |            493.45      | 75                     |
| immer-read                            |         0.27    |        28.997442  | 2         |              0.31      | 1                      |
| mediary-read                          |        16.34    |     11616.488382  | 408       |           5644.49      | 664                    |
| native-read                           |         0.56    |        32.776422  | 1         |             -1.04      | 0                      |
| realize-read                          |        26.68    |     17064.178454  | 837       |           8586.01      | 2409                   |
| immer-write                           |         7.09    |      9671.237337  | 204       |           2808.37      | 122                    |
| mediary-write                         |        10.3     |      8882.896355  | 479       |           5720.75      | 304                    |
| native-write                          |        10.09    |      2909.075585  | 472       |           5646.94      | 500                    |
| realize-write                         |        16.23    |     16680.4807    | 836       |           8687.03      | 2388                   |
