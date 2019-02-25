# Mediary

> Deep clones, without the memory complexity.

Mediary implements structural sharing via proxies. Use mediary's `clone` function to get an object representation which, for all intents and purposes, acts like a deeply cloned copy of your original data. Getting and setting values on this object works natively, as with any "normal" object. The only difference is that under the hood, any changes applied to the object are captured in a transparent patch layer instead of requiring a deep clone of the original data.

```js
const { clone } = require('mediary');

const foo = {
    a: {
        b: [ 'c' ]
    }
};

const bar = clone(foo);

const assert = require('assert');

assert.deepEqual(foo, bar);

bar.a.b.push('d');

assert.deepEqual(foo, { a: { b: [ 'c' ] } });

assert.deepEqual(bar, { a: { b: [ 'c', 'd' ] } });
```
