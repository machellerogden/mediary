# Mediary

> Deep "clone" without the memory complexity.

*WARNING:* This is an experiment. There are still bugs.

Mediary implements structural sharing via proxies in order to provide a transparent virtualization for deep cloning with low memory usage and good performance characteristics.

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

_Tested on 2.2 GHz Intel Core i7 with 16 GB 1600 MHz DDR3_

## Read

|           |   mediary |   native |
|-----------|-----------|----------|
| time      |     73 MS |    13 MS |
| rss       |    3.0 MB |   2.0 MB |
| heapUsed  |    1.0 MB |   1.5 MB |

## Write

|           |   mediary |     native |
|-----------|-----------|------------|
| time      |     78 MS |    1543 MS |
| rss       |    3.3 MB |    37.0 MB |
| heapUsed  |    1.0 MB |    18.1 MB |

## Create

|           |   mediary | JSON.stringify/parse | recursive reduce |
|-----------|-----------|----------------------|------------------|
| time      |     18 MS |              3243 MS |          3480 MS |
| rss       |    5.2 MB |             165.9 MB |         301.5 MB |
| heapUsed  |    2.2 MB |             139.0 MB |         194.5 MB |

# License

MIT
