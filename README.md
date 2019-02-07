# Mediary

> An object immutability helper


## Usage

```js
const mediary = require('mediary');
const { PatchSymbol } = mediary;

const foo = {
    bar: {
        baz: [ 'qux' ]
    }
};

const mediatedFoo = mediary(foo);
mediatedFoo.bar.baz = 'boom';

console.log(foo);
console.log(mediatedFoo);
console.log(mediatedFoo.bar[PatchSymbol]);
```
