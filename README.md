# Mediary

> Mediary implements structural sharing via proxies in order to provide a transparent virtualization for deep cloning.

*WARNING:* This is an experiment. Use at your own risk. Mediary in it's current form has the potential to put quite a bit of pressure on the garbage collector. A well-implemented approach to structural sharing should have the opposite affect. It is not recommended to use this in a production environment.

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
| mediary-incremental                |           2.89 |      89.87877 |                 165.56 |                5.31494 |                 0 |                62 |
| immer-incremental                  |           2.22 |     355.63273 |                 192.50 |                7.48464 |                 0 |                55 |
| mediary-clone-incremental          |           4.54 |    7629.06015 |                2501.35 |               84.88698 |                 0 |               208 |
| mediary-produce-incremental        |           9.40 |    7696.81633 |                2496.51 |               85.47750 |                 0 |               209 |

# Incremental Changes (in a single pass)

This test simulates the real-world use case of adding lots of small changes to a given object in a single pass. 1000 such changes are made to a single cloned object.

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| immer-incremental-single           |           1.07 |       6.40804 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-incremental-single         |           1.27 |      83.71812 |                 167.29 |                4.24086 |                 0 |                60 |
| mediary-clone-incremental-single   |           1.24 |      85.17992 |                 167.31 |                4.63064 |                 0 |                60 |
| mediary-produce-incremental-single |           1.25 |      90.41992 |                   0.00 |                0.00000 |                 0 |                 0 |

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
| immer-leak                         |           0.98 |       2.17577 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-leak                       |           2.26 |       9.54018 |                  -0.54 |                1.07851 |                 0 |                 2 |
| mediary-clone-leak                 |           2.22 |       9.63790 |                  -0.52 |                1.04542 |                 0 |                 2 |
| stringify-leak                     |         146.23 |    1854.69423 |                 439.47 |               32.07086 |                 3 |                45 |
| deepclone-leak                     |         194.58 |    2073.65657 |                 798.66 |              125.88989 |                 6 |                65 |

# Property Get

This test reads every leaf on the large test object 1000 times.

| Test Label                         | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ---------------------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| native-read                        |           1.04 |       6.79761 |                   0.00 |                0.00000 |                 0 |                 0 |
| immer-read                         |           3.24 |    1520.36791 |                 570.51 |               13.40119 |                 0 |               147 |
| mediary-read                       |           4.07 |    2705.94775 |                 904.78 |               16.90100 |                 0 |               119 |
| mediary-clone-read                 |           4.11 |    2716.13952 |                 904.73 |               15.17012 |                 0 |               119 |

# Property Set

This test set a new value to every leaf on the large test object 1000 times.

| Test Label          | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ------------------- | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| native-write        |          17.94 |    1311.37515 |                   0.00 |                0.00000 |                 0 |                 0 |
| mediary-write       |          16.53 |    4599.57087 |                5736.93 |              257.91291 |                 1 |               474 |
| mediary-clone-write |          15.29 |    4693.46944 |                5737.54 |              254.09373 |                 1 |               475 |
| immer-write         |          12.62 |    5358.48230 |                2892.87 |               77.34216 |                 0 |               209 |

# License

MIT
