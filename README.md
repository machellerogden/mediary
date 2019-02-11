# Mediary

> An object immutability helper


## Usage

```js
const Mediary = require('mediary');
const { PatchSymbol } = Mediary;

const foo = {
    bar: {
        baz: [ 'qux' ]
    }
};

const mediatedFoo = Mediary(foo);
mediatedFoo.bar.baz = 'boom';

console.log(foo);
console.log(mediatedFoo);
console.log(mediatedFoo[PatchSymbol]);
console.log(mediatedFoo.bar[PatchSymbol]);
```
