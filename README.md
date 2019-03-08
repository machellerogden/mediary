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

_Tested on 2.6 GHz Intel Core i7 with 16 GB 2400 MHz DDR4_

# Object Creation

This test forces a memory leak and push 1000 "clones" to an array.

Four clone implementations are tested:

   * `mediary.clone(data)`
   * `deepClone(data)` (see [./bench/deepclone-create](./bench/deepclone-create) for implementation)
   * `JSON.parse(JSON.stringify(data))`
   * `mediary.realize(mediary.clone(data))`

| Test Name        | Heap Used  | Elapsed Time    |
|------------------|------------|-----------------|
| mediary-create   | 2.38 MB    | 11.293118 MS    |
| stringify-create | 142.86 MB  | 2269.986464 MS  |
| deepclone-create | 231.95 MB  | 2438.768097 MS  |
| realize-create   | 472.5 MB   | 11808.397295 MS |

Object creation is where mediary outperforms everything else in terms of time and space complexity.

# Property Get

This test reads every leaf on the large test object 1000 times.

| Test Name        | Heap Used  | Elapsed Time    |
|------------------|------------|-----------------|
| native-read      | 1.09 MB    | 8.120928 MS     |
| mediary-read     | 2.68 MB    | 2822.117506 MS  |

There is obviously a significant trade off in time complexity with propery access using mediary.

Mediary also has slightly higher space complexity, though not significant.

Performance degradation here is due to the proxied representations which are created at the time of accessing any given property. This is where Mediary does the most work.

This performance is not where I want it to be and is being working on.

# Property Set

This test set a new value to every leaf on the large test object 1000 times.

| Test Name        | Heap Used  | Elapsed Time    |
|------------------|------------|-----------------|
| mediary-write    | 11.12 MB   | 5084.252828 MS  |
| realize-write    | 14.9 MB    | 1518.473718 MS  |
| native-write     | 16.82 MB   | 1431.833238 MS  |

Here, mediary wins on space complexity but takes a hit on time complexity. That said, the minor slow down should be an acceptable trade off for most applications.

# License

MIT
